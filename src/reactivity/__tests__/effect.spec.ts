import { reactive } from "../src/reactivity";
import { effect, stop } from "../src/effect";

describe("effect", () => {
    it("should run the passed function once (wrapped by a effect)", () => {
      const fnSpy = jest.fn(() => {});
      effect(fnSpy);
      expect(fnSpy).toHaveBeenCalledTimes(1);
    });
  
    it("should observe basic properties", () => {
      let dummy;
      const counter = reactive({ num: 0 });
      effect(() => (dummy = counter.num));
  
      expect(dummy).toBe(0);
      counter.num = 7;
      expect(dummy).toBe(7);
    });

    it("test multiple properties", () => {
      let dummy;
      const counter = reactive({count1: 0, count2: 0});
      effect(() => {
        dummy = counter.count1 + counter.count2;
      });
      expect(dummy).toBe(0);
      counter.count1 = 2;
      expect(dummy).toBe(2);
      counter.count2 = 2;
      expect(dummy).toBe(4);
    });

    it('test runner', () => {
      let foo = 10;
      let runner = effect(() => {
        foo++;
        return 'foo';
      });
      expect(foo).toBe(11);
      let r = runner();
      expect(r).toBe('foo');
      expect(foo).toBe(12);
    });

    it('schedule', () => {
      let dummy;
      let run: any;
      const schedule = jest.fn(() => {
        run = runner;
      })
      const obj = reactive({foo : 1});
      const runner = effect(() => {
        dummy = obj.foo;
      }, { schedule });
      expect(schedule).not.toHaveBeenCalled();
      expect(dummy).toBe(1);
      obj.foo++;
      expect(dummy).toBe(1);
      run();
      expect(dummy).toBe(2);
    })

    it('stop', () => {
      let dummy;
      const obj = reactive({foo: 1});
      const runner = effect(() => {
        dummy = obj.foo;
      })
      expect(dummy).toBe(1);
      obj.foo = 2;
      expect(dummy).toBe(2);
      stop(runner);
      obj.foo = 3;
      expect(dummy).toBe(2);
      runner();
      obj.foo = 3;
      expect(dummy).toBe(3);
    })

    it('onstop', () => {
      const onStop = jest.fn();
      const runner = effect(() => {}, {
        onStop,
      });

      stop(runner);
      expect(onStop).toHaveBeenCalled();
    })
})