import { renderHook, act } from "@testing-library/react";
import { useMinimumLoading } from "../useMinimumLoading";

// Mock setTimeout to control timing in tests
jest.useFakeTimers();

describe("useMinimumLoading", () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it("should maintain loading state for minimum duration even if function completes quickly", async () => {
    const { result } = renderHook(() => useMinimumLoading());

    const quickFunction = jest.fn().mockResolvedValue("quick result");
    const minimumTime = 1200;

    // Start the execution
    const executePromise = act(async () => {
      return result.current.execute(quickFunction, minimumTime);
    });

    // Fast-forward time to 100ms (function should be done)
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Check that loading is still true
    expect(result.current.isLoading).toBe(true);

    // Fast-forward to complete minimum time
    act(() => {
      jest.advanceTimersByTime(minimumTime - 100);
    });

    // Wait for the promise to resolve
    await executePromise;

    // Check that loading is now false and function was called
    expect(result.current.isLoading).toBe(false);
    expect(quickFunction).toHaveBeenCalledTimes(1);
  });

  it("should not extend loading time if function takes longer than minimum", async () => {
    const { result } = renderHook(() => useMinimumLoading());

    const slowFunction = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );
    const minimumTime = 1200;

    // Start the execution
    const executePromise = act(async () => {
      return result.current.execute(slowFunction, minimumTime);
    });

    // Fast-forward time to 2000ms (function completion time)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Wait for the promise to resolve
    await executePromise;

    // Check that loading is false and function was called
    expect(result.current.isLoading).toBe(false);
    expect(slowFunction).toHaveBeenCalledTimes(1);
  });

  it("should handle errors correctly", async () => {
    const { result } = renderHook(() => useMinimumLoading());

    const errorFunction = jest.fn().mockRejectedValue(new Error("Test error"));

    // Start the execution
    const executePromise = act(async () => {
      return result.current.execute(errorFunction);
    });

    // Fast-forward to complete minimum time
    act(() => {
      jest.advanceTimersByTime(1200);
    });

    // Wait for the promise to resolve
    await executePromise;

    // Check that loading is false and error is set
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Test error");
  });
});
