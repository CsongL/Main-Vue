import{ ref } from '../src/ref'
import { effect } from '../src/effect'
describe('ref', () => {
    it("ref function", () => {
        let obj = ref(1);
        expect(obj.value).toBe(1);
    })

    it("should be a reactive", () => {
        let refObject = ref(1);
        let count = 0;
        let dummy;
        let runner = effect(() => {
            count++;
            dummy = refObject.value;
        });
        expect(count).toBe(1);
        expect(dummy).toBe(1);
        refObject.value = 2;
        expect(count).toBe(2);
        expect(dummy).toBe(2);
        refObject.value = 2;
        expect(count).toBe(2);
        expect(dummy).toBe(2);
    })
})