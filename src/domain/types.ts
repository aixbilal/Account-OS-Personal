export const ACCOUNT_CATEGORIES = [
  "Personal",
  "Development",
  "Social",
  "University",
  "Finance",
  "Work",
  "Other",
] as const;

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number];

export const AUTHENTICATION_METHODS = [
  "Password",
  "Google SSO",
  "GitHub OAuth",
  "Apple SSO",
  "Microsoft SSO",
  "Meta",
  "Passkey",
  "Other",
] as const;

export type AuthenticationMethod = (typeof AUTHENTICATION_METHODS)[number];

export const RELATIONSHIP_TYPES = [
  "LOGIN_WITH",
  "GOOGLE_SSO",
  "GITHUB_SSO",
  "RECOVERY_EMAIL",
  "CONNECTED_TO",
  "OWNS",
  "DEPENDS_ON",
  "LINKED_ACCOUNT",
  "2FA_DEVICE",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface Account {
  id: string;
  serviceName: string;
  accountName: string;
  category: AccountCategory;
  username: string;
  email: string;
  password: string;
  authenticationMethod: AuthenticationMethod;
  recoveryInformation: string;
  twoFactorInformation: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountRelationship {
  id: string;
  sourceAccountId: string;
  targetAccountId: string;
  relationshipType: RelationshipType;
  notes: string;
}

export interface VaultData {
  formatVersion: 1;
  accounts: Account[];
  relationships: AccountRelationship[];
  categories: AccountCategory[];
}
