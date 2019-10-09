import { Operators } from './Operator'

export function parseCombinations (operator: any) {
    const [, opname = ''] = (operator.toString() || '').split('#')

    if (!opname) return ;
    if (Operators.hasOwnProperty(opname) && Operators[opname]) {

    }
}