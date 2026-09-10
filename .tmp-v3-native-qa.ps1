$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$qaRoot = "C:\tmp\account-os-v3-overnight"
$appPath = Join-Path $qaRoot "native-qa-target-174071d\release\account-os.exe"
$nativeDriver = Join-Path $qaRoot "drivers\152.0.4191.66\msedgedriver.exe"
$tauriDriver = "C:\Users\mehar\.cargo\bin\tauri-driver.exe"
$evidenceRoot = Join-Path $qaRoot "native-evidence-174071d"
$screenshotRoot = Join-Path $evidenceRoot "screenshots"
$evidencePath = Join-Path $evidenceRoot "native-journey.json"
$driverOut = Join-Path $evidenceRoot "tauri-driver.stdout.log"
$driverErr = Join-Path $evidenceRoot "tauri-driver.stderr.log"
$backupPath = Join-Path $evidenceRoot ("account-os-native-journey-{0}.aosbackup" -f ([guid]::NewGuid().ToString("N")))
$profileId = "com.accountos.desktop.v3overnight20260910"
$profileCandidates = @(
  (Join-Path $env:APPDATA "$profileId\vault.aosvault"),
  (Join-Path $env:LOCALAPPDATA "$profileId\vault.aosvault")
)
$masterPassword = "Overnight-QA-Only!2026"
$wrongPassword = "Incorrect-Synthetic!2026"
$webDriverBase = "http://127.0.0.1:4554"
$script:sessionId = $null
$script:driverProcess = $null
$script:steps = [System.Collections.Generic.List[object]]::new()
$script:startedAt = (Get-Date).ToUniversalTime().ToString("o")
$script:backupHash = $null
$script:vaultPath = $null
$script:wrongRestoreHashBefore = $null
$script:wrongRestoreHashAfter = $null

if (-not (Test-Path -LiteralPath $appPath)) { throw "Missing isolated QA executable: $appPath" }
if (-not (Test-Path -LiteralPath $nativeDriver)) { throw "Missing matching EdgeDriver: $nativeDriver" }
New-Item -ItemType Directory -Path $screenshotRoot -Force | Out-Null

function Save-Evidence {
  $payload = [ordered]@{
    schemaVersion = 1
    run = "Account OS V3 overnight native synthetic journey"
    sourceCommit = "174071da386b04d8701cbd5134c7ee271031543f"
    profileIdentifier = $profileId
    profileVaultPath = $script:vaultPath
    startedAtUtc = $script:startedAt
    finishedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    tauriDriver = (& $tauriDriver --version 2>&1 | Out-String).Trim()
    edgeDriver = (& $nativeDriver --version 2>&1 | Out-String).Trim()
    application = $appPath
    backup = if ($script:backupHash) { [ordered]@{ path = $backupPath; sha256 = $script:backupHash } } else { $null }
    wrongPasswordNonMutation = if ($script:wrongRestoreHashBefore) { [ordered]@{ before = $script:wrongRestoreHashBefore; after = $script:wrongRestoreHashAfter; unchanged = ($script:wrongRestoreHashBefore -eq $script:wrongRestoreHashAfter) } } else { $null }
    steps = @($script:steps)
    totals = [ordered]@{
      expected = 40
      passed = @($script:steps | Where-Object status -eq "PASS").Count
      failed = @($script:steps | Where-Object status -eq "FAIL").Count
    }
  }
  $payload | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $evidencePath -Encoding utf8
}

function Invoke-Wd {
  param(
    [Parameter(Mandatory)][ValidateSet("GET", "POST", "DELETE")][string]$Method,
    [Parameter(Mandatory)][string]$Path,
    [object]$Body = $null,
    [int]$TimeoutSec = 60
  )
  $request = @{
    Method = $Method
    Uri = "$webDriverBase$Path"
    TimeoutSec = $TimeoutSec
  }
  if ($null -ne $Body) {
    $request.ContentType = "application/json"
    $request.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
  }
  $response = Invoke-RestMethod @request
  if ($null -ne $response -and $response.PSObject.Properties.Name -contains "value") { return $response.value }
  return $response
}

function Invoke-Js {
  param([Parameter(Mandatory)][string]$Script, [object[]]$Arguments = @())
  if (-not $script:sessionId) { throw "No active WebDriver session." }
  return Invoke-Wd -Method POST -Path "/session/$script:sessionId/execute/sync" -Body @{ script = $Script; args = [object[]]$Arguments }
}

function Wait-Until {
  param([Parameter(Mandatory)][scriptblock]$Check, [string]$Description = "condition", [int]$TimeoutSec = 30)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  $lastError = $null
  while ((Get-Date) -lt $deadline) {
    try {
      if (& $Check) { return }
    } catch {
      $lastError = $_.Exception.Message
    }
    Start-Sleep -Milliseconds 250
  }
  if ($lastError) { throw "Timed out waiting for $Description. Last error: $lastError" }
  throw "Timed out waiting for $Description."
}

function Wait-Css {
  param([Parameter(Mandatory)][string]$Selector, [int]$TimeoutSec = 30)
  Wait-Until -Description "CSS selector $Selector" -TimeoutSec $TimeoutSec -Check {
    [bool](Invoke-Js -Script "return Boolean(document.querySelector(arguments[0]));" -Arguments @($Selector))
  }
}

function Wait-NoCss {
  param([Parameter(Mandatory)][string]$Selector, [int]$TimeoutSec = 30)
  Wait-Until -Description "absence of CSS selector $Selector" -TimeoutSec $TimeoutSec -Check {
    -not [bool](Invoke-Js -Script "return Boolean(document.querySelector(arguments[0]));" -Arguments @($Selector))
  }
}

function Wait-Text {
  param([Parameter(Mandatory)][string]$Selector, [Parameter(Mandatory)][string]$Text, [int]$TimeoutSec = 30)
  Wait-Until -Description "text '$Text' in $Selector" -TimeoutSec $TimeoutSec -Check {
    [bool](Invoke-Js -Script "const el=document.querySelector(arguments[0]); return Boolean(el && (el.textContent || '').includes(arguments[1]));" -Arguments @($Selector, $Text))
  }
}

function Assert-Js {
  param([Parameter(Mandatory)][string]$Script, [object[]]$Arguments = @(), [Parameter(Mandatory)][string]$Message)
  if (-not [bool](Invoke-Js -Script $Script -Arguments $Arguments)) { throw $Message }
}

function Click-Css {
  param([Parameter(Mandatory)][string]$Selector)
  $result = Invoke-Js -Script @"
const element = document.querySelector(arguments[0]);
if (!element) throw new Error('Missing element: ' + arguments[0]);
if (element.disabled) throw new Error('Disabled element: ' + arguments[0]);
element.click();
return true;
"@ -Arguments @($Selector)
  if (-not $result) { throw "Could not click $Selector" }
}

function Click-ByText {
  param([Parameter(Mandatory)][string]$Selector, [Parameter(Mandatory)][string]$Text, [switch]$Contains)
  $result = Invoke-Js -Script @"
const normalize = value => (value || '').replace(/\s+/g, ' ').trim();
const requested = normalize(arguments[1]);
const contains = Boolean(arguments[2]);
const element = [...document.querySelectorAll(arguments[0])].find(candidate => {
  const actual = normalize(candidate.textContent);
  return contains ? actual.includes(requested) : actual === requested;
});
if (!element) throw new Error('Missing text control: ' + requested);
if (element.disabled) throw new Error('Disabled text control: ' + requested);
element.click();
return true;
"@ -Arguments @($Selector, $Text, [bool]$Contains)
  if (-not $result) { throw "Could not click '$Text'" }
}

function Click-Aria {
  param([Parameter(Mandatory)][string]$Label, [int]$Index = 0)
  $result = Invoke-Js -Script @"
const matches = [...document.querySelectorAll('[aria-label]')].filter(element => element.getAttribute('aria-label') === arguments[0]);
const element = matches[arguments[1]];
if (!element) throw new Error('Missing aria-label: ' + arguments[0] + ' at index ' + arguments[1]);
if (element.disabled) throw new Error('Disabled aria-label: ' + arguments[0]);
element.click();
return true;
"@ -Arguments @($Label, $Index)
  if (-not $result) { throw "Could not click aria-label '$Label'" }
}

function Set-Field {
  param([Parameter(Mandatory)][string]$Selector, [Parameter(Mandatory)][AllowEmptyString()][string]$Value)
  $actual = Invoke-Js -Script @"
const element = document.querySelector(arguments[0]);
if (!element) throw new Error('Missing field: ' + arguments[0]);
const prototype = Object.getPrototypeOf(element);
const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
if (!descriptor || !descriptor.set) throw new Error('No value setter: ' + arguments[0]);
descriptor.set.call(element, arguments[1]);
element.dispatchEvent(new Event('input', { bubbles: true }));
element.dispatchEvent(new Event('change', { bubbles: true }));
return element.value;
"@ -Arguments @($Selector, $Value)
  if ([string]$actual -ne $Value) { throw "Field $Selector did not retain the requested synthetic value." }
}

function Select-Option {
  param([Parameter(Mandatory)][string]$Selector, [Parameter(Mandatory)][string]$Requested)
  $actual = Invoke-Js -Script @"
const element = document.querySelector(arguments[0]);
if (!element) throw new Error('Missing select: ' + arguments[0]);
const requested = arguments[1];
const option = [...element.options].find(candidate => candidate.value === requested || (candidate.textContent || '').trim() === requested);
if (!option) throw new Error('Missing option: ' + requested);
const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
descriptor.set.call(element, option.value);
element.dispatchEvent(new Event('input', { bubbles: true }));
element.dispatchEvent(new Event('change', { bubbles: true }));
return element.value;
"@ -Arguments @($Selector, $Requested)
  if (-not $actual) { throw "Select $Selector did not accept $Requested" }
}

function Click-Nav {
  param([Parameter(Mandatory)][ValidateSet("Vault", "Map", "Settings")][string]$Name)
  Click-ByText -Selector ".nav-list button" -Text $Name
}

function Click-SettingsSection {
  param([Parameter(Mandatory)][string]$Name)
  Click-ByText -Selector "aside[aria-label='Settings sections'] button" -Text $Name
}

function Click-MapNode {
  param([Parameter(Mandatory)][string]$AccountTitle)
  $result = Invoke-Js -Script @"
const wrapper = [...document.querySelectorAll('.react-flow__node')].find(node => (node.querySelector('strong')?.textContent || '').trim() === arguments[0]);
if (!wrapper) throw new Error('Missing map node: ' + arguments[0]);
wrapper.click();
return true;
"@ -Arguments @($AccountTitle)
  if (-not $result) { throw "Could not click Map node $AccountTitle" }
}

function Get-Screenshot {
  param([Parameter(Mandatory)][string]$Name)
  $encoded = Invoke-Wd -Method GET -Path "/session/$script:sessionId/screenshot"
  $path = Join-Path $screenshotRoot ("{0}.png" -f $Name)
  [System.IO.File]::WriteAllBytes($path, [Convert]::FromBase64String([string]$encoded))
  return $path
}

function New-NativeSession {
  $capabilities = @{ capabilities = @{ alwaysMatch = @{ "tauri:options" = @{ application = $appPath } } } }
  $created = Invoke-Wd -Method POST -Path "/session" -Body $capabilities -TimeoutSec 120
  $id = [string]$created.sessionId
  if (-not $id) { throw "tauri-driver did not return a session id." }
  $script:sessionId = $id
  $null = Invoke-Wd -Method POST -Path "/session/$script:sessionId/window/rect" -Body @{ x = 32; y = 24; width = 1440; height = 900 }
  return $id
}

function Close-NativeSession {
  if (-not $script:sessionId) { return }
  $closingId = $script:sessionId
  $script:sessionId = $null
  try { $null = Invoke-Wd -Method DELETE -Path "/session/$closingId" -Body @{} -TimeoutSec 30 } catch { }
  Start-Sleep -Milliseconds 750
}

function Add-Account {
  param([Parameter(Mandatory)][hashtable]$Account, [string]$PreFillScreenshot = "")
  Click-Css -Selector ".vault-list-header button.primary-button"
  Wait-Css -Selector ".modal-sheet.account-editor[aria-modal='true']"
  if ($PreFillScreenshot) { $null = Get-Screenshot -Name $PreFillScreenshot }
  Set-Field -Selector "#account-serviceName" -Value $Account.service
  Set-Field -Selector "#account-accountName" -Value $Account.title
  Set-Field -Selector "#account-email" -Value $Account.email
  Set-Field -Selector "#account-username" -Value $Account.username
  Set-Field -Selector "#account-website" -Value $Account.website
  Set-Field -Selector "#account-password" -Value $Account.password
  Click-Css -Selector ".modal-sheet.account-editor[aria-modal='true'] .details-toggle"
  Wait-Css -Selector "#account-category"
  Select-Option -Selector "#account-category" -Requested $Account.category
  Select-Option -Selector "#account-authenticationMethod" -Requested $Account.authentication
  Set-Field -Selector "#account-twoFactorInformation" -Value $Account.twoFactor
  Set-Field -Selector "#account-recoveryInformation" -Value $Account.recovery
  Set-Field -Selector "#account-notes" -Value $Account.notes
  Click-Css -Selector ".modal-sheet.account-editor[aria-modal='true'] form.editor-form button[type='submit']"
  Wait-NoCss -Selector ".modal-sheet.account-editor[aria-modal='true']" -TimeoutSec 45
  Wait-Until -Description "saved account $($Account.title)" -TimeoutSec 30 -Check {
    [bool](Invoke-Js -Script "return [...document.querySelectorAll(arguments[0])].some(el => (el.textContent || '').trim() === arguments[1]);" -Arguments @("ul[aria-label='Account list'] strong", $Account.title))
  }
}

function Select-VaultAccount {
  param([Parameter(Mandatory)][string]$AccountTitle)
  $result = Invoke-Js -Script @"
const button = [...document.querySelectorAll("ul[aria-label='Account list'] button")].find(candidate => (candidate.querySelector('strong')?.textContent || '').trim() === arguments[0]);
if (!button) throw new Error('Missing vault account: ' + arguments[0]);
button.click();
return true;
"@ -Arguments @($AccountTitle)
  if (-not $result) { throw "Could not select $AccountTitle" }
  Wait-Css -Selector ("[aria-label='{0} account details']" -f $AccountTitle.Replace("'", "\'"))
}

function Begin-RelationshipAdd {
  Click-Css -Selector ".relationship-manager-view button.primary-button"
  Wait-Css -Selector ".relationship-dialog[aria-modal='true'] form.relationship-form"
}

function Complete-RelationshipAdd {
  param([Parameter(Mandatory)][string]$Target, [Parameter(Mandatory)][string]$Type, [Parameter(Mandatory)][string]$Notes)
  Select-Option -Selector "#relationship-target" -Requested $Target
  Select-Option -Selector "#relationship-type" -Requested $Type
  Set-Field -Selector "#relationship-notes" -Value $Notes
  Click-Css -Selector ".relationship-dialog[aria-modal='true'] form.relationship-form button[type='submit']"
  Wait-Css -Selector ".relationship-dialog[aria-modal='true'] .relationship-manager-view" -TimeoutSec 45
}

function Complete-MapRelationshipAdd {
  param([Parameter(Mandatory)][string]$Target, [Parameter(Mandatory)][string]$Type, [Parameter(Mandatory)][string]$Notes)
  Select-Option -Selector "#relationship-target" -Requested $Target
  Select-Option -Selector "#relationship-type" -Requested $Type
  Set-Field -Selector "#relationship-notes" -Value $Notes
  Click-Css -Selector ".relationship-dialog[aria-modal='true'] form.relationship-form button[type='submit']"
  Wait-NoCss -Selector ".relationship-dialog[aria-modal='true']" -TimeoutSec 45
}

function Get-VaultCountText {
  return [string](Invoke-Js -Script "return document.querySelector('.vault-list-header #vault-title + p')?.textContent || '';" )
}

function Invoke-Step {
  param([Parameter(Mandatory)][int]$Number, [Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][scriptblock]$Action)
  $began = (Get-Date).ToUniversalTime()
  Write-Output ("STEP {0:D2} START {1}" -f $Number, $Name)
  try {
    $detail = & $Action
    $finished = (Get-Date).ToUniversalTime()
    $script:steps.Add([ordered]@{
      number = $Number
      name = $Name
      status = "PASS"
      evidence = if ($detail) { [string]$detail } else { "Completed and asserted in the native Tauri session." }
      durationMs = [int](($finished - $began).TotalMilliseconds)
    })
    Save-Evidence
    Write-Output ("STEP {0:D2} PASS  {1}" -f $Number, $Name)
  } catch {
    $message = $_.Exception.Message
    if ($script:sessionId) {
      try { $null = Get-Screenshot -Name ("failure-step-{0:D2}" -f $Number) } catch { }
    }
    $script:steps.Add([ordered]@{
      number = $Number
      name = $Name
      status = "FAIL"
      evidence = $message
      durationMs = [int](((Get-Date).ToUniversalTime() - $began).TotalMilliseconds)
    })
    Save-Evidence
    Write-Output ("STEP {0:D2} FAIL  {1}: {2}" -f $Number, $Name, $message)
    throw
  }
}

$google = @{ service = "Google"; title = "Google QA"; email = "google.qa@example.invalid"; username = "google.qa"; website = "https://google.qa.invalid"; password = "Google-QA-Only!41"; category = "Personal"; authentication = "Password"; twoFactor = "Synthetic authenticator metadata"; recovery = "Synthetic recovery only"; notes = "Synthetic overnight Google account." }
$spotify = @{ service = "Spotify"; title = "Spotify QA"; email = "spotify.qa@example.invalid"; username = "spotify.qa"; website = "https://spotify.qa.invalid"; password = "Spotify-QA-Only!42"; category = "Personal"; authentication = "Password"; twoFactor = ""; recovery = "Synthetic recovery only"; notes = "Synthetic overnight Spotify account." }
$github = @{ service = "GitHub"; title = "GitHub QA"; email = "github.qa@example.invalid"; username = "github-qa"; website = "https://github.qa.invalid"; password = "GitHub-QA-Only!43"; category = "Development"; authentication = "GitHub OAuth"; twoFactor = "Synthetic security key metadata"; recovery = "Synthetic recovery only"; notes = "Synthetic overnight GitHub account." }
$instagram = @{ service = "Instagram"; title = "Instagram QA"; email = "instagram.qa@example.invalid"; username = "instagram.qa"; website = "https://instagram.qa.invalid"; password = "Instagram-QA-Only!44"; category = "Social"; authentication = "Meta"; twoFactor = "Synthetic authenticator metadata"; recovery = "Synthetic recovery only"; notes = "Synthetic overnight Instagram account." }
$custom = @{ service = "Northern Star Archive"; title = "Custom Service QA"; email = "custom.qa@example.invalid"; username = "custom.qa"; website = "https://northern-star.qa.invalid"; password = "Custom-QA-Only!45"; category = "Other"; authentication = "Other"; twoFactor = ""; recovery = "Synthetic recovery only"; notes = "Synthetic unknown-service fallback account." }
$mutation = @{ service = "Mutation Service"; title = "Mutation QA"; email = "mutation.qa@example.invalid"; username = "mutation.qa"; website = "https://mutation.qa.invalid"; password = "Mutation-QA-Only!46"; category = "Other"; authentication = "Password"; twoFactor = ""; recovery = "Synthetic mutation recovery"; notes = "Synthetic post-backup mutation." }

try {
  $script:driverProcess = Start-Process -PassThru -WindowStyle Hidden -FilePath $tauriDriver -ArgumentList @("--port", "4554", "--native-port", "4555", "--native-driver", $nativeDriver) -RedirectStandardOutput $driverOut -RedirectStandardError $driverErr
  Wait-Until -Description "tauri-driver readiness" -TimeoutSec 30 -Check {
    try { $null = Invoke-Wd -Method GET -Path "/status" -TimeoutSec 2; return $true } catch { return $false }
  }
  $null = New-NativeSession
  Wait-Css -Selector "#vault-entry-title" -TimeoutSec 60
  Wait-Text -Selector "#vault-entry-title" -Text "Create your local vault" -TimeoutSec 30
  $null = Get-Screenshot -Name "01-create-vault"

  Invoke-Step 1 "Create Vault" {
    Set-Field -Selector "#entry-masterPassword" -Value $masterPassword
    Set-Field -Selector "#entry-masterPasswordConfirmation" -Value $masterPassword
    Click-Css -Selector "button.entry-submit"
    Wait-Css -Selector ".app-shell" -TimeoutSec 90
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "0 accounts" -TimeoutSec 30
    $null = Get-Screenshot -Name "03-vault-empty"
    "Created a zero-account encrypted vault under the isolated QA identifier."
  }

  Invoke-Step 2 "Lock" {
    Click-Css -Selector ".sidebar-lock"
    Wait-Text -Selector "#vault-entry-title" -Text "Unlock your local vault" -TimeoutSec 45
    $null = Get-Screenshot -Name "02-unlock-vault"
    "Locked the native vault and reached the unlock screen."
  }

  Invoke-Step 3 "Unlock" {
    Set-Field -Selector "#entry-masterPassword" -Value $masterPassword
    Click-Css -Selector "button.entry-submit"
    Wait-Css -Selector ".app-shell" -TimeoutSec 90
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "0 accounts" -TimeoutSec 30
    "Unlocked the isolated encrypted vault with its synthetic master password."
  }

  Invoke-Step 4 "Add Google account" {
    Add-Account -Account $google -PreFillScreenshot "07-add-account"
    Assert-Js -Script "return (document.querySelector(arguments[0])?.textContent || '').includes('Google');" -Arguments @("[aria-label='Google QA account details']") -Message "Google account inspector was not selected after save."
    "Saved Google QA with synthetic credentials."
  }

  Invoke-Step 5 "Add Spotify account" {
    Add-Account -Account $spotify
    $null = Get-Screenshot -Name "05-spotify-selected"
    "Saved Spotify QA with synthetic credentials."
  }

  Invoke-Step 6 "Add GitHub account" {
    Add-Account -Account $github
    "Saved GitHub QA with Development/GitHub OAuth metadata."
  }

  Invoke-Step 7 "Add Instagram account" {
    Add-Account -Account $instagram
    "Saved Instagram QA with Social/Meta metadata."
  }

  Invoke-Step 8 "Add unknown custom service" {
    Add-Account -Account $custom
    $null = Get-Screenshot -Name "06-unknown-service-selected"
    Assert-Js -Script "return Boolean(document.querySelector(arguments[0]));" -Arguments @("[aria-label='Custom Service QA account details'] .service-fallback") -Message "Unknown service did not render the local fallback identity."
    "Saved Northern Star Archive and verified the unknown-service fallback."
  }

  Invoke-Step 9 "Include real synthetic website values" {
    Select-VaultAccount -AccountTitle "Google QA"
    Assert-Js -Script "return (document.querySelector(arguments[0])?.textContent || '').includes('https://google.qa.invalid');" -Arguments @("[aria-label='Google QA account details']") -Message "Google synthetic website was not displayed."
    Set-Field -Selector "#vault-search" -Value "northern-star.qa.invalid"
    Assert-Js -Script "return [...document.querySelectorAll(arguments[0])].map(el => el.textContent.trim()).join('|') === 'Custom Service QA';" -Arguments @("ul[aria-label='Account list'] strong") -Message "Website was not included in Vault search."
    Set-Field -Selector "#vault-search" -Value ""
    "Verified stored website display and website-aware search."
  }

  Invoke-Step 10 "Select Google" {
    Select-VaultAccount -AccountTitle "Google QA"
    $null = Get-Screenshot -Name "04-google-selected"
    "Selected Google QA and displayed its inspector."
  }

  Invoke-Step 11 "Copy email" {
    Click-Aria -Label "Copy email"
    Wait-Css -Selector ".toast" -TimeoutSec 5
    Assert-Js -Script "return (document.querySelector('.toast')?.textContent || '').includes('Email copied');" -Message "Native clipboard did not report a successful email copy."
    $null = Get-Screenshot -Name "16-copy-toast"
    "Native WebView clipboard reported Email copied."
  }

  Invoke-Step 12 "Reveal password" {
    Click-Aria -Label "Reveal password"
    Wait-Css -Selector "[aria-label='Hide password']"
    Assert-Js -Script "return (document.querySelector(arguments[0])?.textContent || '').includes('Google-QA-Only!41');" -Arguments @("[aria-label='Google QA account details']") -Message "Synthetic password was not revealed."
    "Revealed the synthetic password in the selected inspector."
  }

  Invoke-Step 13 "Hide password" {
    Click-Aria -Label "Hide password"
    Wait-Css -Selector "[aria-label='Reveal password']"
    Assert-Js -Script "return !(document.querySelector(arguments[0])?.textContent || '').includes('Google-QA-Only!41');" -Arguments @("[aria-label='Google QA account details']") -Message "Synthetic password remained visible after Hide."
    "Returned the inspector password to its masked state."
  }

  Invoke-Step 14 "Copy password" {
    Click-Aria -Label "Copy password"
    Wait-Until -Description "Password copied toast" -TimeoutSec 5 -Check {
      [bool](Invoke-Js -Script "return (document.querySelector('.toast')?.textContent || '').includes('Password copied');")
    }
    "Native WebView clipboard reported Password copied."
  }

  Invoke-Step 15 "Edit Google" {
    Click-Css -Selector ".account-inspector .inspector-edit"
    Wait-Css -Selector ".modal-sheet.account-editor[aria-modal='true']"
    $null = Get-Screenshot -Name "08-edit-account"
    Set-Field -Selector "#account-accountName" -Value "Google QA Updated"
    Set-Field -Selector "#account-notes" -Value "Synthetic overnight Google account, updated in native QA."
    "Changed Google account title and notes in the native editor."
  }

  Invoke-Step 16 "Save Google edit" {
    Click-Css -Selector ".modal-sheet.account-editor[aria-modal='true'] form.editor-form button[type='submit']"
    Wait-NoCss -Selector ".modal-sheet.account-editor[aria-modal='true']" -TimeoutSec 45
    Wait-Css -Selector "[aria-label='Google QA Updated account details']"
    "Persisted the Google QA Updated edit."
  }

  Invoke-Step 17 "Search Spotify" {
    Set-Field -Selector "#vault-search" -Value "Spotify"
    Assert-Js -Script "return [...document.querySelectorAll(arguments[0])].map(el => el.textContent.trim()).join('|') === 'Spotify QA';" -Arguments @("ul[aria-label='Account list'] strong") -Message "Spotify search did not resolve to exactly one synthetic account."
    "Vault search returned only Spotify QA."
  }

  Invoke-Step 18 "Clear search" {
    Set-Field -Selector "#vault-search" -Value ""
    Assert-Js -Script "return document.querySelectorAll(arguments[0]).length === 5;" -Arguments @("ul[aria-label='Account list'] li") -Message "Clearing Vault search did not restore five accounts."
    "Cleared search and restored all five accounts."
  }

  Invoke-Step 19 "Filter category" {
    Select-Option -Selector "select[name='categoryFilter']" -Requested "Development"
    Assert-Js -Script "return [...document.querySelectorAll(arguments[0])].map(el => el.textContent.trim()).join('|') === 'GitHub QA';" -Arguments @("ul[aria-label='Account list'] strong") -Message "Development filter did not resolve to GitHub QA."
    "Development category filter returned only GitHub QA."
  }

  Invoke-Step 20 "Clear category filter" {
    Select-Option -Selector "select[name='categoryFilter']" -Requested "all"
    Assert-Js -Script "return document.querySelectorAll(arguments[0]).length === 5;" -Arguments @("ul[aria-label='Account list'] li") -Message "Clearing category filter did not restore five accounts."
    "Cleared category filter and restored all accounts."
  }

  Invoke-Step 21 "Create five relationships using multiple types" {
    Select-VaultAccount -AccountTitle "Google QA Updated"
    Click-Css -Selector ".account-inspector .inspector-relationships .text-button"
    Wait-Css -Selector ".relationship-dialog[aria-modal='true'] .relationship-manager-view"
    Begin-RelationshipAdd
    $null = Get-Screenshot -Name "09-add-relationship"
    Complete-RelationshipAdd -Target "Spotify QA" -Type "CONNECTED_TO" -Notes "Synthetic connected relationship."
    Begin-RelationshipAdd
    Complete-RelationshipAdd -Target "GitHub QA" -Type "GOOGLE_SSO" -Notes "Synthetic Google sign-in relationship."
    Begin-RelationshipAdd
    Complete-RelationshipAdd -Target "Instagram QA" -Type "RECOVERY_EMAIL" -Notes "Synthetic recovery relationship."
    Begin-RelationshipAdd
    Complete-RelationshipAdd -Target "Custom Service QA" -Type "LINKED_ACCOUNT" -Notes "Synthetic linked account relationship."
    Begin-RelationshipAdd
    Complete-RelationshipAdd -Target "Spotify QA" -Type "LOGIN_WITH" -Notes "Synthetic login relationship."
    Assert-Js -Script "return document.querySelectorAll('.relationship-manager-view .relationship-manage-list li').length === 5;" -Message "Relationship manager did not show five stored relationships."
    "Created five stored relationships spanning Connected, Google sign-in, Recovery, Linked, and Login types."
  }

  Invoke-Step 22 "Edit one relationship" {
    Click-Aria -Label "Edit relationship with Spotify QA" -Index 0
    Wait-Text -Selector "#relationship-dialog-title" -Text "Edit relationship"
    Select-Option -Selector "#relationship-type" -Requested "OWNS"
    Set-Field -Selector "#relationship-notes" -Value "Synthetic edited ownership relationship."
    $null = Get-Screenshot -Name "10-edit-relationship"
    Click-Css -Selector ".relationship-dialog[aria-modal='true'] form.relationship-form button[type='submit']"
    Wait-Css -Selector ".relationship-dialog[aria-modal='true'] .relationship-manager-view" -TimeoutSec 45
    Assert-Js -Script "return [...document.querySelectorAll('.relationship-manager-view .relationship-manage-list small')].some(el => (el.textContent || '').trim() === 'Owns');" -Message "Edited relationship type was not shown as Owns."
    "Changed one Spotify relationship to Owns and persisted the edited note."
  }

  Invoke-Step 23 "Remove one relationship" {
    Click-Aria -Label "Edit relationship with Custom Service QA"
    Wait-Text -Selector "#relationship-dialog-title" -Text "Edit relationship"
    Click-Css -Selector ".relationship-dialog[aria-modal='true'] form.relationship-form button.danger-button"
    Wait-Css -Selector "#remove-relationship-title"
    $null = Get-Screenshot -Name "15-remove-confirmation"
    Click-ByText -Selector "section[aria-modal='true'] button.danger-button" -Text "Remove relationship"
    Wait-Css -Selector ".relationship-dialog[aria-modal='true'] .relationship-manager-view" -TimeoutSec 45
    Assert-Js -Script "return document.querySelectorAll('.relationship-manager-view .relationship-manage-list li').length === 4;" -Message "Relationship manager did not fall back to four relationships."
    "Confirmed removal; both accounts remained and the relationship count became four."
  }

  Invoke-Step 24 "Create one relationship from Map" {
    Click-Aria -Label "Close relationship dialog"
    Wait-NoCss -Selector ".relationship-dialog[aria-modal='true']"
    Click-Nav -Name "Map"
    Wait-Css -Selector ".map-explorer" -TimeoutSec 30
    Wait-Until -Description "five Map nodes" -TimeoutSec 30 -Check { [bool](Invoke-Js -Script "return document.querySelectorAll('.react-flow__node').length === 5;") }
    Click-MapNode -AccountTitle "GitHub QA"
    Wait-Text -Selector ".map-inspector" -Text "GitHub QA"
    Click-ByText -Selector ".map-inspector-actions button" -Text "Create relationship"
    Wait-Css -Selector ".relationship-dialog[aria-modal='true'] form.relationship-form"
    Complete-MapRelationshipAdd -Target "Custom Service QA" -Type "DEPENDS_ON" -Notes "Synthetic Map-origin dependency."
    Wait-Text -Selector ".screen-header > span" -Text "5 relationships" -TimeoutSec 30
    "Created a GitHub-to-custom Depends on relationship from the Map inspector."
  }

  Invoke-Step 25 "Open Map" {
    Wait-Css -Selector ".map-explorer"
    Assert-Js -Script "return document.querySelectorAll('.react-flow__node').length === 5 && document.querySelectorAll('.react-flow__edge').length === 5;" -Message "Map did not render exactly the five real accounts and five real relationships."
    $null = Get-Screenshot -Name "11-map-populated"
    "Verified the populated Map contains five stored account nodes and five stored relationship edges."
  }

  Invoke-Step 26 "Select multiple Map nodes" {
    Click-MapNode -AccountTitle "Spotify QA"
    Wait-Text -Selector ".map-inspector" -Text "Spotify QA"
    Click-MapNode -AccountTitle "Instagram QA"
    Wait-Text -Selector ".map-inspector" -Text "Instagram QA"
    Assert-Js -Script "return document.querySelectorAll('.map-node[data-selected=true]').length === 1;" -Message "Map did not retain exactly one selected node."
    Assert-Js -Script "return [...document.querySelectorAll('.map-connections > div span')].every(span => { const a=span.querySelector('strong')?.getBoundingClientRect(); const b=span.querySelector('small')?.getBoundingClientRect(); return !a || !b || a.bottom <= b.top + 1; });" -Message "Map connection title and relationship label overlap."
    $null = Get-Screenshot -Name "12-map-selected-node"
    "Selected Spotify then Instagram and verified non-overlapping connection labels."
  }

  Invoke-Step 27 "Search Map" {
    Set-Field -Selector "#map-search" -Value "GitHub"
    Assert-Js -Script "const nodes=[...document.querySelectorAll('.map-node')]; const normal=nodes.filter(n => n.dataset.focus === 'normal'); return nodes.length === 5 && normal.length === 1 && (normal[0].querySelector('strong')?.textContent || '').trim() === 'GitHub QA' && nodes.filter(n => n.dataset.focus === 'muted').length === 4;" -Message "Map search did not keep only the GitHub match emphasized."
    "Map search emphasized GitHub QA and muted the four non-matches, including the prior selection."
  }

  Invoke-Step 28 "Fit graph" {
    Click-ByText -Selector ".map-toolbar button" -Text "Fit graph"
    Start-Sleep -Milliseconds 350
    Assert-Js -Script "return Number.isFinite(window.document.querySelector('.react-flow__viewport')?.getBoundingClientRect().width);" -Message "React Flow viewport was not available after Fit graph."
    "Executed Fit graph on the native React Flow viewport."
  }

  Invoke-Step 29 "Open selected Map node in Vault" {
    Click-Aria -Label "Clear Map search"
    Click-ByText -Selector ".map-inspector-actions button" -Text "Open in Vault"
    Wait-Css -Selector "[aria-label='Instagram QA account details']"
    "Opened the selected Instagram QA node in the Vault inspector."
  }

  Invoke-Step 30 "Settings Appearance" {
    Click-Nav -Name "Settings"
    Wait-Css -Selector "#theme-option-light"
    $null = Get-Screenshot -Name "13-settings-appearance-light"
    Click-Css -Selector "#theme-option-dark"
    Wait-Until -Description "dark document theme" -TimeoutSec 10 -Check { [bool](Invoke-Js -Script "return document.documentElement.dataset.theme === 'dark';") }
    Assert-Js -Script "return [...document.querySelectorAll('.theme-choice button span')].every(span => { const a=span.querySelector('strong')?.getBoundingClientRect(); const b=span.querySelector('small')?.getBoundingClientRect(); return !a || !b || a.bottom <= b.top + 1; });" -Message "Dark theme option descriptions overlap their titles."
    $null = Get-Screenshot -Name "13b-settings-appearance-dark"
    Click-Css -Selector "#theme-option-light"
    Wait-Until -Description "light document theme" -TimeoutSec 10 -Check { [bool](Invoke-Js -Script "return document.documentElement.dataset.theme === 'light';") }
    "Verified Light and Dark Appearance controls plus non-overlapping option copy."
  }

  Invoke-Step 31 "Settings Data and Recovery" {
    Click-SettingsSection -Name "Data & Recovery"
    Wait-Text -Selector ".settings-section-header h2" -Text "Data & Recovery"
    $null = Get-Screenshot -Name "14-settings-data-recovery"
    "Opened the real encrypted backup and restore controls."
  }

  Invoke-Step 32 "Export encrypted backup" {
    $installResult = Invoke-Js -Script @"
const internals = window.__TAURI_INTERNALS__;
if (!internals || typeof internals.invoke !== 'function') throw new Error('Tauri internals are unavailable.');
if (!window.__accountOsOriginalInvoke) window.__accountOsOriginalInvoke = internals.invoke.bind(internals);
window.__accountOsQaBackupPath = arguments[0];
internals.invoke = function(command, args, options) {
  if (command === 'plugin:dialog|save' || command === 'plugin:dialog|open') return Promise.resolve(window.__accountOsQaBackupPath);
  return window.__accountOsOriginalInvoke(command, args, options);
};
return 'installed';
"@ -Arguments @($backupPath)
    if ($installResult -ne "installed") { throw "Dialog interception was not installed." }
    if (Test-Path -LiteralPath $backupPath) { throw "Backup destination was not unique." }
    Click-ByText -Selector ".settings-card button" -Text "Export encrypted backup"
    Wait-Until -Description "encrypted backup export" -TimeoutSec 60 -Check { (Test-Path -LiteralPath $backupPath) -and [bool](Invoke-Js -Script "return (document.querySelector('.settings-card:not(.restore-card) .operation-message')?.textContent || '').includes('exported successfully');") }
    $bytes = [System.IO.File]::ReadAllBytes($backupPath)
    if ($bytes.Length -lt 128) { throw "Encrypted backup was unexpectedly small." }
    $decoded = [Text.Encoding]::UTF8.GetString($bytes)
    foreach ($secretFragment in @("Google QA Updated", "google.qa@example.invalid", "Google-QA-Only!41")) {
      if ($decoded.Contains($secretFragment)) { throw "Encrypted backup leaked plaintext synthetic vault data." }
    }
    $script:backupHash = (Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash
    "Exported a non-plaintext .aosbackup through the real Rust IPC path (SHA-256 $script:backupHash)."
  }

  Invoke-Step 33 "Mutate synthetic vault" {
    Click-Nav -Name "Vault"
    Wait-Css -Selector "#vault-title"
    Add-Account -Account $mutation
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "6 accounts"
    "Added Mutation QA after the backup; live vault count became six accounts."
  }

  Invoke-Step 34 "Restore backup with correct password" {
    Click-Nav -Name "Settings"
    Wait-Css -Selector "#theme-option-light"
    Click-SettingsSection -Name "Data & Recovery"
    Wait-Css -Selector ".restore-card"
    Click-ByText -Selector ".restore-card button" -Text "Choose backup file"
    Wait-Until -Description "selected encrypted backup" -TimeoutSec 15 -Check { [bool](Invoke-Js -Script "return document.querySelector('.selected-file')?.dataset.selected === 'true';") }
    Set-Field -Selector "#backup-master-password" -Value $masterPassword
    Click-ByText -Selector ".restore-card button.primary-button" -Text "Restore encrypted backup"
    Wait-Css -Selector "#confirm-restore-title"
    $null = Get-Screenshot -Name "15b-restore-confirmation"
    Click-ByText -Selector "section[aria-modal='true'] button.primary-button" -Text "Restore and replace"
    Wait-Until -Description "successful encrypted restore" -TimeoutSec 90 -Check { [bool](Invoke-Js -Script "return (document.querySelector('#restore-operation-status')?.textContent || '').includes('validated and restored');") }
    "Validated and restored the encrypted backup through the real Rust IPC path."
  }

  Invoke-Step 35 "Verify restored counts" {
    Click-Nav -Name "Vault"
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "5 accounts"
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "5 relationships"
    Assert-Js -Script "return ![...document.querySelectorAll(arguments[0])].some(el => (el.textContent || '').trim() === 'Mutation QA');" -Arguments @("ul[aria-label='Account list'] strong") -Message "Post-backup mutation survived the restore."
    "Restore returned the vault to five accounts and five relationships; Mutation QA was absent."
  }

  Invoke-Step 36 "Wrong-password restore preserves current vault" {
    $script:vaultPath = $profileCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $script:vaultPath) { throw "Could not resolve the isolated profile vault at either exact expected path." }
    $script:wrongRestoreHashBefore = (Get-FileHash -LiteralPath $script:vaultPath -Algorithm SHA256).Hash
    Click-Nav -Name "Settings"
    Wait-Css -Selector "#theme-option-light"
    Click-SettingsSection -Name "Data & Recovery"
    Wait-Css -Selector ".restore-card"
    Click-ByText -Selector ".restore-card button" -Text "Choose backup file"
    Wait-Until -Description "selected encrypted backup for wrong-password attempt" -TimeoutSec 15 -Check { [bool](Invoke-Js -Script "return document.querySelector('.selected-file')?.dataset.selected === 'true';") }
    Set-Field -Selector "#backup-master-password" -Value $wrongPassword
    Click-ByText -Selector ".restore-card button.primary-button" -Text "Restore encrypted backup"
    Wait-Css -Selector "#confirm-restore-title"
    Click-ByText -Selector "section[aria-modal='true'] button.primary-button" -Text "Restore and replace"
    Wait-Until -Description "wrong-password restore error" -TimeoutSec 90 -Check { [bool](Invoke-Js -Script "return (document.querySelector('#restore-operation-status')?.textContent || '').includes('current vault was not changed');") }
    $script:wrongRestoreHashAfter = (Get-FileHash -LiteralPath $script:vaultPath -Algorithm SHA256).Hash
    if ($script:wrongRestoreHashBefore -ne $script:wrongRestoreHashAfter) { throw "Encrypted vault bytes changed after the wrong-password restore attempt." }
    $null = Get-Screenshot -Name "16b-wrong-password-error"
    Click-Nav -Name "Vault"
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "5 accounts"
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "5 relationships"
    "Wrong-password restore reported an error and preserved the encrypted vault byte-for-byte."
  }

  Invoke-Step 37 "Close app" {
    Close-NativeSession
    "Deleted the first WebDriver session and closed its isolated native app instance."
  }

  Invoke-Step 38 "Reopen app" {
    $null = New-NativeSession
    Wait-Text -Selector "#vault-entry-title" -Text "Unlock your local vault" -TimeoutSec 60
    $null = Get-Screenshot -Name "02b-reopen-unlock"
    "Reopened the same isolated executable/profile and reached Unlock, not Create."
  }

  Invoke-Step 39 "Unlock reopened vault" {
    Set-Field -Selector "#entry-masterPassword" -Value $masterPassword
    Click-Css -Selector "button.entry-submit"
    Wait-Css -Selector ".app-shell" -TimeoutSec 90
    "Unlocked the reopened encrypted profile with its synthetic master password."
  }

  Invoke-Step 40 "Verify persistence" {
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "5 accounts"
    Wait-Text -Selector ".vault-list-header #vault-title + p" -Text "5 relationships"
    Click-Nav -Name "Map"
    Wait-Css -Selector ".map-explorer"
    Assert-Js -Script "return document.querySelectorAll('.react-flow__node').length === 5 && document.querySelectorAll('.react-flow__edge').length === 5;" -Message "Reopened Map did not preserve five accounts and five relationships."
    $null = Get-Screenshot -Name "17-persistence-final"
    "After process close/reopen/unlock, all five accounts and five relationships remained."
  }

  Save-Evidence
  Write-Output "NATIVE_JOURNEY_COMPLETE"
  Write-Output "EVIDENCE=$evidencePath"
  Write-Output "SCREENSHOTS=$screenshotRoot"
  Write-Output "BACKUP=$backupPath"
} finally {
  if ($script:sessionId) { Close-NativeSession }
  if ($script:driverProcess -and -not $script:driverProcess.HasExited) {
    Stop-Process -Id $script:driverProcess.Id -Force -ErrorAction SilentlyContinue
    try { $script:driverProcess.WaitForExit(5000) | Out-Null } catch { }
  }
  Save-Evidence
}
