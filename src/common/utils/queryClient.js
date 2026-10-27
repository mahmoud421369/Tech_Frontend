import { QueryClient } from '@tanstack/react-query';


export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, gcTime: 10 * 60 * 1000 },
  },
});

export default queryClient;