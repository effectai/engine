import {CallbackPayload, ResolvedSigningRequest, SigningRequest} from '@wharfkit/session'
import zlib from 'pako'

import {mockChainId, mockPublicKey} from './mock-config'
import {mockAbiProvider} from './mock-context'

export const mockCallbackPayload: CallbackPayload = {
    sig: 'SIG_K1_K4nkCupUx3hDXSHq4rhGPpDMPPPjJyvmF3M6j7ppYUzkR3L93endwnxf3YhJSG4SSvxxU1ytD8hj39kukTeYxjwy5H3XNJ',
    tx: 'b8e921a7b68d7309847e633d74963f25eb5a7d0b15b1aceb143723c234686a8d',
    rbn: '0',
    rid: '0',
    ex: '2020-07-10T08:40:20',
    req: 'esr://AgABAwACE2h0dHBzOi8vZXhhbXBsZS5jb20A',
    sa: 'wharfkit1115',
    sp: 'test',
    cid: mockChainId,
    link_ch: 'https://cb.test.com/a5b24a32-cce5-4ab5-b63d-8e29f83e25a9',
    link_key: mockPublicKey,
    link_name: 'anchor',
}

export const makeMockResolvedSigningRequest = () =>
    ResolvedSigningRequest.fromPayload(mockCallbackPayload, {zlib, abiProvider: mockAbiProvider})

export const mockSigningRequest = SigningRequest.from(mockCallbackPayload.req, {
    zlib,
})
