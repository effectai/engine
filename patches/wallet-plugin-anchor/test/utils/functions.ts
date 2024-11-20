import {Action, AnyAction, Transaction} from '@wharfkit/session'
import {SigningRequest} from '@wharfkit/signing-request'

/**
 * Prepend an action to the end of the array of actions in a SigningRequest.
 *
 * @param request SigningRequest
 * @param action AnyAction
 * @returns SigningRequest
 */
export function prependAction(request: SigningRequest, action: AnyAction): SigningRequest {
    const newAction = Action.from(action)
    const cloned = request.clone()
    if (cloned.data.req.value instanceof Action) {
        // Overwrite the data
        cloned.data.req.value = [newAction, cloned.data.req.value]
        // This needs to be done to indicate it's an `Action[]`
        cloned.data.req.variantIdx = 1
    } else if (cloned.data.req.value instanceof Array) {
        // Prepend the action to the existing array
        cloned.data.req.value.unshift(newAction)
    } else if (cloned.data.req.value instanceof Transaction) {
        // Prepend the action to the existing array of the transaction
        cloned.data.req.value.actions.unshift(newAction)
    }
    return cloned
}
