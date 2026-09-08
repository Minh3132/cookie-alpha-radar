import { useCallback, useMemo, useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection } from '@solana/web3.js'
import { COOKIE_RPC } from '../lib/config'

declare global {
  interface Window {
    nightly?: { solana?: { changeNetwork?: (network: { genesisHash: string; url?: string }) => Promise<unknown>; genesisHash?: string } }
  }
}

export function WalletPanel() {
  const [networkState, setNetworkState] = useState<'idle' | 'switching' | 'done' | 'missing' | 'error'>('idle')
  const label = useMemo(() => ({ idle: 'Set Nightly → Cookie', switching: 'Switching…', done: 'Nightly ready', missing: 'Install Nightly', error: 'Retry network' }[networkState]), [networkState])

  const switchNightly = useCallback(async () => {
    const nightly = window.nightly?.solana
    if (!nightly?.changeNetwork) { setNetworkState('missing'); window.open('https://nightly.app', '_blank', 'noopener,noreferrer'); return }
    setNetworkState('switching')
    try {
      const connection = new Connection(COOKIE_RPC, 'confirmed')
      const genesisHash = await connection.getGenesisHash()
      await nightly.changeNetwork({ genesisHash, url: COOKIE_RPC })
      setNetworkState('done')
    } catch { setNetworkState('error') }
  }, [])

  return (
    <div className="wallet-panel">
      <button className="ghost-button" onClick={switchNightly} disabled={networkState === 'switching'}>{label}</button>
      <WalletMultiButton />
    </div>
  )
}
