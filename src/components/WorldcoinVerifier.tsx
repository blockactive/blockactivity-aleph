"use client"
import React, { useState, useEffect } from 'react'
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Search, User, Activity, CheckCircle, Menu, X } from 'lucide-react'

const getAddressActivity = async (address: string): Promise<any> => {
  try {
    console.log("entertry")
    const response = await fetch(`http://localhost:5001/moralisaddress?address=${encodeURIComponent(address)}`);
    console.log("res:", response)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("data")
    const data = await response.json();
    console.log(data);

    // Sort active chains by the last transaction timestamp
    const sortedChains = data.active_chains
      .filter((chain: any) => chain.last_transaction !== null)
      .sort((a: any, b: any) => {
        if (a.last_transaction && b.last_transaction) {
          return new Date(b.last_transaction.block_timestamp).getTime() - new Date(a.last_transaction.block_timestamp).getTime();
        }
        return 0;
      });


    
    return {
      ...data,
      active_chains: sortedChains
    };
  } catch (error) {
    console.error("Error fetching address activity:", error);
    return null;
  }
};


const isAddressVerified = (address: string) => {
  const verifiedAddresses = JSON.parse(localStorage.getItem('worldcoinVerifiedAddresses') || '[]')
  return verifiedAddresses.includes(address)
}

const addVerifiedAddress = (address: string) => {
  const verifiedAddresses = JSON.parse(localStorage.getItem('worldcoinVerifiedAddresses') || '[]')
  if (!verifiedAddresses.includes(address)) {
    verifiedAddresses.push(address)
    localStorage.setItem('worldcoinVerifiedAddresses', JSON.stringify(verifiedAddresses))
  }
}

const onSuccess = () => {
  console.log("Success")
};

// Verifica la prueba en el backend
const verifyProof = async (proof: any) => {
  try {
    // Enviar la prueba a tu ruta del servidor para la verificación
    const response = await fetch('/api/verify-proof', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ proof })
    })

    if (!response.ok) {
      throw new Error("La verificación falló en el servidor")
    }

    return response.json()
  } catch (error) {
    console.error("Error al verificar la prueba:", error)
    throw error
  }
}

export default function Component() {
  const [searchAddress, setSearchAddress] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [userAddress, setUserAddress] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const storedAddress = localStorage.getItem('userAddress')
    if (storedAddress) {
      setUserAddress(storedAddress)
    }
  }, [])

  const handleSearch = async () => {
    console.log("handleSearch triggered");

    if (searchAddress) {
      console.log("searchAddress", searchAddress);

      const activeChains = await getAddressActivity(searchAddress)
      console.log("activeChains", activeChains);
console.log("searchAddress", searchAddress);

      const isVerified = isAddressVerified(searchAddress)
      setSearchResult({ address: searchAddress, activeChains, isVerified })
    }
  }

  const handleWorldCoinSuccess = async (result: any) => {
    console.log("WorldCoin verification successful", result)
    
    // Suponiendo que recibes la dirección como parte del resultado
    const mockAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    setUserAddress(mockAddress)
    localStorage.setItem('userAddress', mockAddress)
    addVerifiedAddress(mockAddress)
  }

  const onVerify = async (proof: any) => {
    try {
      await verifyProof(proof)
      handleWorldCoinSuccess(proof)
    } catch (error) {
      console.error("Verificación fallida:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl text-white">BlockActivity</span>
            </div>
            <div className="hidden md:block">
              {!userAddress ? (
                <IDKitWidget
                app_id="app_3eeb8164183e69fa87f6272cff16b521"
                action="login"
                // On-chain only accepts Orb verifications
                verification_level={VerificationLevel.Orb}
                handleVerify={verifyProof}
                onSuccess={onSuccess}>
                {({ open }) => (
                  <button
                    onClick={open}
                  >
                    Verify with World ID
                  </button>
                )}
            </IDKitWidget>
              ) : (
                <div className="flex items-center text-sm text-gray-300">
                  <User className="mr-2 h-4 w-4" />
                  <span className="mr-2">Logged in:</span>
                  <span className="font-medium">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
                </div>
              )}
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 shadow-md p-4">
          {!userAddress ? (
            <IDKitWidget
              app_id="app_3eeb8164183e69fa87f6272cff16b521"
              action="login"
              verification_level={VerificationLevel.Orb}
              handleVerify={onVerify}
              onSuccess={handleWorldCoinSuccess}
            >
              {({ open }) => (
                <Button onClick={open} variant="outline" className="w-full bg-gray-700 text-white hover:bg-gray-600">
                  <User className="mr-2 h-4 w-4" /> Login with WorldCoin
                </Button>
              )}
            </IDKitWidget>
          ) : (
            <div className="flex items-center text-sm text-gray-300">
              <User className="mr-2 h-4 w-4" />
              <span className="mr-2">Logged in:</span>
              <span className="font-medium">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
            </div>
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-white">Search for an Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Enter address to search"
                  className="flex-grow bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                />
                <Button onClick={handleSearch} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                  <Search className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchResult && (
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <CardTitle className="text-xl sm:text-2xl text-white">Search Result</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <User className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-300">Address:</span>
          <span className="break-all text-white">{searchResult.address}</span>
          {searchResult.isVerified && (
            <CheckCircle className="h-5 w-5 text-green-500 ml-2" aria-label="Verified by Worldcoin">
              <title>Verified by Worldcoin</title>
            </CheckCircle>
          )}
        </div>
        <div>
  <h3 className="font-medium mb-2 text-gray-300">Active Chains:</h3>
  {searchResult && searchResult.activeChains && searchResult.activeChains.length > 0 ? (
    <ul className="list-disc list-inside text-gray-300">
      {searchResult.activeChains.map((chain: any, index: number) => (
        <li key={index} className="ml-4">
          <span className="font-medium">{chain.chain}</span>: {chain.last_transaction.block_timestamp}
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500">No active chains found.</p>
  )}
</div>
      </div>
    </CardContent>
  </Card>
)}

        </div>
      </main>
    </div>
  )
}
