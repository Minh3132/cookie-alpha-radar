import { useMemo, type PropsWithChildren } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { COOKIE_RPC } from '../lib/config'
import '@solana/wallet-adapter-react-ui/styles.css'

export function Providers({ children }: PropsWithChildren) {
  const endpoint = useMemo(() => COOKIE_RPC, [])
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
