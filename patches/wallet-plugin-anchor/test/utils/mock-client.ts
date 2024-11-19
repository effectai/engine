import {APIClient, FetchProvider} from '@wharfkit/session'

import {mockUrl} from './mock-config'
import {mockFetch} from '$test/utils/mock-fetch'

export function makeClient(url?: string) {
    return new APIClient({
        provider: new FetchProvider(url || mockUrl, {fetch: mockFetch}),
    })
}
