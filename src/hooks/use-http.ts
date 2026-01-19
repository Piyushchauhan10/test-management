import { useState, useCallback } from "react";

const useHttp = () => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>({});

  const sendRequest = useCallback(async (url: string, options: any = {}) => {
    setLoading(true);
    setError({});

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      // ✅ HANDLE DELETE / 204 NO CONTENT
      if (response.status === 204) {
        const result = {
          success: true,
          data: null,
          message: "Deleted successfully",
        };
        setData(result);
        return result;
      }

      // ✅ SAFE JSON PARSING
      const result = await response.json();

      const value = result?.value ?? result;

      const finalResult = {
        success: true,
        data: value,
        message: "Data fetched successfully",
      };

      setData(finalResult);
      return finalResult;
    } catch (err: any) {
      const errorResult = {
        success: false,
        data: [],
        message: err.message,
      };
      setError(errorResult);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, sendRequest };
};

export default useHttp;
