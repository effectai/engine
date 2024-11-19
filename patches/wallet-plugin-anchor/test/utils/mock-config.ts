import {ChainDefinition, PrivateKey} from '@wharfkit/session'

export const mockChainId = '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d'
export const mockChainId2 = '34593b65376aee3c9b06ea8a8595122b39333aaab4c76ad52587831fcc096590'
export const mockUrl = 'https://jungle4.greymass.com'
export const mockChainDefinition: ChainDefinition = ChainDefinition.from({
    id: mockChainId,
    url: mockUrl,
})
export const mockChainDefinitions: ChainDefinition[] = [
    mockChainDefinition,
    ChainDefinition.from({
        id: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
        url: 'https://eos.greymass.com',
    }),
    ChainDefinition.from({
        id: '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
        url: 'https://telos.greymass.com',
    }),
    ChainDefinition.from({
        id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        url: 'https://wax.greymass.com',
    }),
    ChainDefinition.from({
        id: '34593b65376aee3c9b06ea8a8595122b39333aaab4c76ad52587831fcc096590',
        url: 'https://jungle4.greymass.com',
    }),
]
export const mockPrivateKey = '5Jtoxgny5tT7NiNFp1MLogviuPJ9NniWjnU4wKzaX4t7pL4kJ8s'
export const mockPublicKey = String(PrivateKey.from(mockPrivateKey).toPublic())
export const mockAccountName = 'wharfkit1111'
export const mockPermissionName = 'test'
export const mockPermissionLevel = `${mockAccountName}@${mockPermissionName}`

export const mockSignature1 =
    'SIG_K1_KA8Pk3FprCgnRJiwuagttm6Bg6zZWc6uuNMcy3dgMKPUeRHxFRPq7ePuRriU4uVq5FgHxF9yWBJKm1kVRE4VwYFxoZ2e7s'
