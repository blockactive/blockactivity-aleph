"use client"
import React, { useState, useEffect } from 'react'
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Search, User, Activity, CheckCircle, Menu, X } from 'lucide-react'
import { GoPlusLabs } from '@normalizex/gopluslabs-api';
const goPlus = new GoPlusLabs();

const getAddressActivity = async (address: string): Promise<any> => {
  try {
    const response = await fetch(`http://localhost:5001/addressActivity?address=${encodeURIComponent(address)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Sort active chains by the last transaction timestamp
    data.active_chains = data.active_chains
    .filter((chain: any) => chain.last_transaction !== null)
    .sort((a: any, b: any) => {
      return new Date(b.last_transaction.block_timestamp).getTime() - new Date(a.last_transaction.block_timestamp).getTime();
    });

  return data;
  } catch (error) {
    console.error("Error fetching address activity:", error);
    return null;
  }
};

const checkAddressSecurity = async (address: string) => {
  const chainId = "1";

  try {
    const res = await goPlus.addressSecurity(chainId, address)  as AddressSecurityResponse;
console.log("res",res)


if (res.contract_address === "1" ) {
  return "This address belongs to a contract.";
}


  // Check if any other field has the value "1"
  const hasMaliciousActivity = Object.keys(res).some((field) => {
    // Ignore the contract_address and mixer fields
    if (field !== "contract_address" && field !== "mixer") {
      return res[field] === "1";
    }
    return false;
  });

  if (hasMaliciousActivity) {
    return "The address has malicious activity detected." ;
  }
// If no malicious activity detected
return "This address doesn't have any malicious activity detected.";

  } catch (error) {
    console.error('An error occurred:', error);
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
  const [activeChains, setActiveChains] = useState<any[]>([]);
  const [verification, setVerification] = useState<boolean>(false);
  const [maliciousActivityVerifier, setMaliciousActivityVerifier] = useState('');

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
      const activityData = await getAddressActivity(searchAddress)
      const isVerified = isAddressVerified(searchAddress)

      const securityMessage = await checkAddressSecurity(searchAddress);
      setMaliciousActivityVerifier(securityMessage || '');  
          //i should set the maliciousActivityVerifier value here
      if (activityData && activityData.active_chains) {
        setActiveChains(activityData.active_chains);
      } else {
        setActiveChains([]); 
      }

      setVerification(isVerified)
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


  {searchAddress && 
  (<Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <CardTitle className="text-xl sm:text-2xl text-white">Search Result</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <User className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-300">Address:</span>
          <span className="break-all text-white">{searchAddress}</span>
          {verification && (
            <CheckCircle className="h-5 w-5 text-green-500 ml-2" aria-label="Verified by Worldcoin">
              <title>Verified by Worldcoin</title>
            </CheckCircle>
          )}
        </div>
     
        <div>
  <h3 className="font-medium mb-2 text-gray-300">Active Chains:</h3>
 
  {activeChains && (activeChains.length > 0) ? (
    
    <ul className="list-disc list-inside text-gray-300">
      {activeChains.map((chain: any, index: number) => (

        <li key={index} className="ml-4 mb-2">
          <span className="font-semibold text-md underline ">{chain.chain}</span> <br /> <p className='text-sm text-white italic '>Last usage:  {chain.last_transaction.block_timestamp}</p>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500">Press the button to se results!
    If you pressed the button and still nothing... no activity was found in any chain.</p>
  )}
   {maliciousActivityVerifier && (
  <p className="text-orange-500 mb-4">{maliciousActivityVerifier}</p>
)}
</div>
      </div>
    </CardContent>
  </Card>)
  }        

        </div>
   
      </main>
    </div>
  )
}
