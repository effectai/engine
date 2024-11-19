import chai, {expect} from 'chai'
import {PermissionLevel, SessionKit} from '@wharfkit/session'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import * as buoy from '@greymass/buoy'

chai.use(sinonChai)

import {mockSessionKitArgs, mockSessionKitOptions} from '@wharfkit/mock-data'
import {mockCallbackPayload} from '$test/utils/mock-esr'
import {mockChainId} from '$test/utils/mock-config'

const mockPermissionLevel = PermissionLevel.from('wharfkit1115@test')

suite('wallet plugin', function () {
    this.timeout(120 * 1000)
    this.slow(5 * 1000)

    // TODO: Implement a real test, this currently open a socket and expects Anchor to respond.
    test('login and sign', async function () {
        sinon.stub(buoy, 'receive').resolves(JSON.stringify(mockCallbackPayload))
        sinon.stub(buoy, 'send')

        const kit = new SessionKit(mockSessionKitArgs, mockSessionKitOptions)
        const {session} = await kit.login({
            chain: mockChainId,
            permissionLevel: mockPermissionLevel,
        })

        expect(String(session.chain.id)).to.equal(mockChainId)
        expect(String(session.actor)).to.equal(String(mockPermissionLevel.actor))
        expect(String(session.permission)).to.equal(String(mockPermissionLevel.permission))

        const result = await session.transact(
            {
                action: {
                    authorization: [mockPermissionLevel],
                    account: 'eosio.token',
                    name: 'transfer',
                    data: {
                        from: mockPermissionLevel.actor,
                        to: 'wharfkittest',
                        quantity: '0.0001 EOS',
                        memo: 'wharfkit/session wallet plugin template',
                    },
                },
            },
            {
                broadcast: false,
            }
        )

        expect(String(result.signer.actor)).to.equal(String(mockPermissionLevel.actor))
        expect(String(result.signer.permission)).to.equal(String(mockPermissionLevel.permission))
        expect(result.signatures).to.be.length(1)
    })
})
