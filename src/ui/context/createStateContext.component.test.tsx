import type { PropsWithChildren } from "react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStateContext } from "./createStateContext";

type CounterState = {
  count: number;
  increment: () => void;
};

const useCounterValue = (initialValue: number): CounterState => {
  const [count, setCount] = useState(initialValue);
  return { count, increment: () => setCount((prev) => prev + 1) };
};

const [CounterProvider, useCounter] = createStateContext(useCounterValue);

function CounterDisplay() {
  const { count, increment } = useCounter();
  return (
    <div>
      <span>count: {count}</span>
      <button onClick={increment}>increment</button>
    </div>
  );
}

describe("createStateContext", () => {
  it("Provider가 useValue(initialValue) 결과를 하위 Consumer에 노출한다", () => {
    render(
      <CounterProvider initialValue={5}>
        <CounterDisplay />
      </CounterProvider>,
    );

    expect(screen.getByText("count: 5")).toBeInTheDocument();
  });

  it("사용자 interaction으로 state가 갱신되면 Consumer가 재렌더된다", async () => {
    const user = userEvent.setup();
    render(
      <CounterProvider initialValue={0}>
        <CounterDisplay />
      </CounterProvider>,
    );

    await user.click(screen.getByRole("button", { name: "increment" }));

    expect(screen.getByText("count: 1")).toBeInTheDocument();
  });

  it("같은 Provider 아래 여러 Consumer가 동일한 갱신된 값을 공유한다", async () => {
    const user = userEvent.setup();
    render(
      <CounterProvider initialValue={0}>
        <CounterDisplay />
        <CounterDisplay />
      </CounterProvider>,
    );

    const [firstButton] = screen.getAllByRole("button", { name: "increment" });
    await user.click(firstButton);

    const counts = screen.getAllByText("count: 1");
    expect(counts).toHaveLength(2);
  });

  it("Provider 밖에서 훅을 사용하면 에러를 던진다", () => {
    // 이 테스트는 의도된 throw 시나리오다 — React가 발생시키는 console.error를
    // 이 테스트 범위에서만 억제하고 종료 전에 복구한다(docs/__test/component.md).
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useCounter())).toThrow("Provider is missing!");

    consoleErrorSpy.mockRestore();
  });

  it("Provider가 다르면 각자의 initialValue로 독립된 state를 유지한다", () => {
    const wrapperA = ({ children }: PropsWithChildren) => (
      <CounterProvider initialValue={10}>{children}</CounterProvider>
    );
    const wrapperB = ({ children }: PropsWithChildren) => (
      <CounterProvider initialValue={20}>{children}</CounterProvider>
    );

    const { result: resultA } = renderHook(() => useCounter(), { wrapper: wrapperA });
    const { result: resultB } = renderHook(() => useCounter(), { wrapper: wrapperB });

    expect(resultA.current.count).toBe(10);
    expect(resultB.current.count).toBe(20);
  });
});
