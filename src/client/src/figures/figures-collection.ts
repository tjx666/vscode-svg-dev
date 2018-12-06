import { Figure } from "./figure.model";


export class FiguresCollection {

    private types = new Set<Figure<any>>();

    
    add(...types: Figure<any>[]) {
        /**
         * add types
         */
        types.forEach(type => this.types.add(type));
    }

    delegate(element: {} | string) {
        for (let type of this.types) {
            if (typeof element === 'object' && type.testByElement(element)) {
                return type;
            } else if (typeof element === 'string' && type.name === element) {
                return type;
            }
        }
    }

    getFiltered<K extends keyof Figure<any>>(key: K): Figure<any>[] {
        return Array.from(this.types).filter(t => !!t[key]);
    }

}
