export interface IAppEnvironment {
    envType: string;
    storageEncryption?: boolean;
    version?: string;
    build?: string;
    endpointUrl?:string;
}
