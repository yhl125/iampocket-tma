import React, { useEffect, useMemo, useState } from 'react';
import { AccountNFToken, AccountNFTsRequest, Client } from 'xrpl';
import { getXrplCilent, XrplNetwork } from '@/utils/xrpl';
import { IRelayPKP, SessionSigsMap } from '@lit-protocol/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface NFTListProps {
  sessionSigs?: SessionSigsMap;
  currentAccount?: IRelayPKP;
  xrplAddress?: string;
  xrplNetwork: XrplNetwork;
}

interface NFTData {
  NFTokenID: string;
  URI?: string;
  name?: string;
  image?: string;
}

const NFTCard: React.FC<{ nft: NFTData }> = ({ nft }) => {
  let URL = '';
  if (nft.image) {
    URL = nft.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  }

  return (
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105">
      <CardContent className="p-0">
        <div className="relative w-full pb-[100%]">
          {nft.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={URL}
              alt={nft.name || 'NFT'}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
              No image
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm truncate">
            {nft.name || 'Unnamed NFT'}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
};

const SkeletonNFTCard: React.FC = () => (
  <Card className="w-full overflow-hidden">
    <CardContent className="p-0">
      <div className="relative w-full pb-[100%] bg-gray-200 animate-pulse" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

export const NFTList: React.FC<NFTListProps> = ({
  xrplAddress,
  xrplNetwork,
}) => {
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchNFTs() {
      if (!xrplAddress) {
        console.error('No XRPL address provided');
        return;
      }

      setLoading(true);

      try {
        const client = getXrplCilent(xrplNetwork);
        await client.connect();

        const response = await client.request<AccountNFTsRequest>({
          command: 'account_nfts',
          account: xrplAddress,
          ledger_index: 'validated',
        });

        const fetchedNFTs = response.result.account_nfts;
        const nftData: NFTData[] = await Promise.all(
          fetchedNFTs.map(async (nft) => {
            let name = 'Unnamed NFT';
            let image = '';

            if (nft.URI) {
              try {
                const uriString = Buffer.from(nft.URI, 'hex').toString('utf-8');
                const response = await fetch(uriString);
                const metadata = await response.json();
                name = metadata.name || 'Unnamed NFT';
                image = metadata.image || '';
              } catch (error) {
                console.error('Error fetching NFT metadata:', error);
              }
            }

            return {
              NFTokenID: nft.NFTokenID,
              URI: nft.URI,
              name,
              image,
            };
          }),
        );

        setNfts(nftData);
      } catch (err) {
        console.error('Error fetching NFTs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [xrplAddress, xrplNetwork]);

  const filteredNfts = useMemo(() => {
    if (!searchTerm) {
      return nfts;
    }

    return nfts.filter((nft) => {
      return nft.name?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [nfts, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">My Collection</h1>
        <div className="relative">
          <Input
            placeholder="Search NFTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[...Array(6)].map((_, index) => (
              <SkeletonNFTCard key={index} />
            ))}
          </div>
        ) : filteredNfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-xl font-semibold text-gray-500 mb-2">
              No NFTs Found
            </p>
            <p className="text-gray-400">
              {searchTerm
                ? 'Try adjusting your search term.'
                : "It looks like you don't have any NFTs yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filteredNfts.map((nft) => (
              <NFTCard key={nft.NFTokenID} nft={nft} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};