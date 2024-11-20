import {
    ABICache,
    APIClient,
    ChainDefinition,
    FetchProvider,
    LoginContext,
    Name,
    PermissionLevel,
    Session,
    SigningRequest,
    TransactArgs,
    TransactContext,
    TransactContextOptions,
} from '@wharfkit/session'
import zlib from 'pako'

import {mockChainDefinition, mockUrl} from './mock-config'
import {mockFetch} from '$test/utils/mock-fetch'
import {mockSessionArgs, mockSessionOptions} from '@wharfkit/mock-data'
import {mockLoginHook} from './mock-hook'
import {makeWallet} from './mock-wallet'
import {MockUserInterface} from './mock-userinterface'

export const client = new APIClient({
    provider: new FetchProvider(mockUrl, {fetch: mockFetch}),
})

export const session = new Session(mockSessionArgs, mockSessionOptions)
export const mockAbiProvider = new ABICache(client)

export const mockTransactContextOptions: TransactContextOptions = {
    abiCache: mockAbiProvider,
    chain: ChainDefinition.from(mockChainDefinition),
    client,
    createRequest: async (args: TransactArgs): Promise<SigningRequest> =>
        session.createRequest(args, mockAbiProvider),
    fetch: mockFetch,
    permissionLevel: PermissionLevel.from('wharfkit1125@test'),
}

const wallet = makeWallet()

export const mockLoginContext: LoginContext = {
    appName: 'mock',
    arbitrary: {},
    fetch: mockFetch, // Required for unit tests
    ui: new MockUserInterface(),
    walletPlugins: [wallet],
    chains: [mockChainDefinition],
    hooks: {
        beforeLogin: [],
        afterLogin: [mockLoginHook],
    },
    uiRequirements: {
        requiresChainSelect: true,
        requiresPermissionEntry: false,
        requiresPermissionSelect: true,
        requiresWalletSelect: true,
    },
    addHook: () => {},
    getClient: () => client,
    esrOptions: {
        zlib,
    },
}

export function makeContext(): TransactContext {
    return new TransactContext(mockTransactContextOptions)
}
