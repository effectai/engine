import { Struct } from "anchor-link";

@Struct.type('sign_data')
export class SignData extends Struct {
    @Struct.field('string') declare message: string
}
