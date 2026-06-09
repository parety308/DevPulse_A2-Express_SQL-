export type TRoles = "maintainer" | "contributor";
export interface IssueQuery {
    sort?: string;
    type?: string;
    status?: string;
}