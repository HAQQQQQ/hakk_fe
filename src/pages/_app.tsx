// pages/_app.tsx
import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import ReactQueryProvider from "../lib/ReactQueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Header from "../components/Header";
import { ToastContainer } from "react-toastify";
import { Provider } from "../components/ui/provider";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<ClerkProvider {...pageProps}>
			<ReactQueryProvider>
				<Provider>
					<div>
						<Header />
						<Component {...pageProps} />
						<ToastContainer position="bottom-right" autoClose={3000} />
						<ReactQueryDevtools initialIsOpen={true} />
					</div>
				</Provider>
			</ReactQueryProvider>
		</ClerkProvider>
	);
}

export default MyApp;
