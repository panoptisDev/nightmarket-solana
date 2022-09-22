import type { GetServerSidePropsContext } from 'next';
import { WalletProfileQuery, CollectedNFTsQuery } from './../../../queries/profile.graphql';
import ProfileLayout, {
  WalletProfileData,
  WalletProfileVariables,
} from '../../../layouts/ProfileLayout';
import client from './../../../client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Wallet, Nft } from '../../../graphql.types';
import { ReactElement, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Toolbar } from '../../../components/Toolbar';
import { Sidebar } from '../../../components/Sidebar';
import { ButtonGroup } from '../../../components/ButtonGroup';
import { useTranslation } from 'next-i18next';
import useSidebar from '../../../hooks/sidebar';
import { QueryResult, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { NftCard } from '../../../components/NftCard';
import { List, ListGridSize } from './../../../components/List';
import { Collection } from './../../../components/Collection';
import { Listbox } from '@headlessui/react';
import { Offerable } from '../../../components/Offerable';
import { Buyable } from '../../../components/Buyable';
import { useWallet } from '@solana/wallet-adapter-react';

export async function getServerSideProps({ locale, params }: GetServerSidePropsContext) {
  const i18n = await serverSideTranslations(locale as string, ['common', 'profile', 'collection']);

  const {
    data: { wallet },
  } = await client.query({
    query: WalletProfileQuery,
    variables: {
      address: params?.address,
    },
  });

  if (wallet === null) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      wallet,
      ...i18n,
    },
  };
}

enum ListedStatus {
  All = 'all',
  Listed = 'listed',
  Unlisted = 'unlisted',
}

interface CollectionNFTForm {
  listed: ListedStatus;
  collections: (string | undefined)[] | null | undefined;
}

interface CollectionNFTsData {
  wallet: Wallet;
}

interface CollectionNFTsVariables {
  address: string;
  offset: number;
  limit: number;
  collections?: (string | undefined)[] | null | undefined;
}

export default function ProfileCollected({
  walletProfileClientQuery,
}: {
  walletProfileClientQuery: QueryResult<WalletProfileData, WalletProfileVariables>;
}) {
  const { t } = useTranslation(['collection', 'common']);
  const { watch, control } = useForm<CollectionNFTForm>({
    defaultValues: { listed: ListedStatus.All, collections: [] },
  });
  const { publicKey } = useWallet();
  const router = useRouter();
  const { open, toggleSidebar } = useSidebar();
  const [hasMore, setHasMore] = useState(true);

  const nftsQuery = useQuery<CollectionNFTsData, CollectionNFTsVariables>(CollectedNFTsQuery, {
    variables: {
      offset: 0,
      limit: 24,
      address: router.query.address as string,
    },
  });

  useEffect(() => {
    const subscription = watch(({ listed, collections }) => {
      let variables: CollectionNFTsVariables = {
        offset: 0,
        limit: 24,
        address: router.query.address as string,
        collections,
      };

      if (variables?.collections?.length === 0) {
        variables.collections = null;
      }

      nftsQuery.refetch(variables).then(({ data: { wallet } }) => {
        setHasMore(wallet.nfts.length > 0);
      });
    });

    return subscription.unsubscribe;
  }, [watch, router.query.address, nftsQuery]);

  return (
    <>
      <Toolbar>
        <Sidebar.Control
          open={open}
          onChange={toggleSidebar}
          disabled={walletProfileClientQuery.data?.wallet?.collectedCollections.length === 0}
        />
      </Toolbar>
      <Sidebar.Page open={open}>
        <Sidebar.Panel
          onChange={toggleSidebar}
          disabled={walletProfileClientQuery.data?.wallet?.collectedCollections.length === 0}
        >
          <div className="mt-4 flex flex-col gap-2">
            {walletProfileClientQuery.loading ? (
              <>
                <Collection.Option.Skeleton />
                <Collection.Option.Skeleton />
                <Collection.Option.Skeleton />
                <Collection.Option.Skeleton />
                <Collection.Option.Skeleton />
              </>
            ) : (
              <Controller
                control={control}
                name="collections"
                render={({ field: { onChange, value } }) => (
                  <Listbox value={value} onChange={onChange} multiple>
                    <Listbox.Options static>
                      {walletProfileClientQuery.data?.wallet?.collectedCollections.map((cc) => (
                        <Listbox.Option
                          key={cc.collection?.nft.mintAddress}
                          value={cc.collection?.nft.mintAddress}
                        >
                          {({ selected }) => (
                            <Collection.Option
                              selected={selected}
                              avatar={
                                <Collection.Option.Avatar
                                  src={cc.collection?.nft.image as string}
                                  figure={cc.nftsOwned.toString()}
                                />
                              }
                              header={
                                <Collection.Option.Title>
                                  {cc.collection?.nft.name}
                                </Collection.Option.Title>
                              }
                              floorPrice={cc.collection?.floorPrice}
                            >
                              <Collection.Option.EstimatedValue amount={cc.estimatedValue} />
                            </Collection.Option>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                )}
              />
            )}
          </div>
        </Sidebar.Panel>
        <Sidebar.Content>
          <Offerable connected={Boolean(publicKey)}>
            {({ makeOffer }) => (
              <Buyable connected={Boolean(publicKey)}>
                {({ buyNow }) => (
                  <List
                    expanded={open}
                    data={nftsQuery.data?.wallet.nfts}
                    loading={nftsQuery.loading}
                    gap={4}
                    hasMore={hasMore}
                    grid={{
                      [ListGridSize.Default]: [1, 1],
                      [ListGridSize.Small]: [2, 2],
                      [ListGridSize.Medium]: [2, 3],
                      [ListGridSize.Large]: [3, 4],
                      [ListGridSize.ExtraLarge]: [4, 6],
                      [ListGridSize.Jumbo]: [6, 8],
                    }}
                    skeleton={NftCard.Skeleton}
                    onLoadMore={async (inView: boolean) => {
                      if (!inView) {
                        return;
                      }

                      const {
                        data: { wallet },
                      } = await nftsQuery.fetchMore({
                        variables: {
                          ...nftsQuery.variables,
                          offset: nftsQuery.data?.wallet.nfts.length,
                        },
                      });

                      setHasMore(wallet.nfts.length > 0);
                    }}
                    render={(nft, i) => (
                      <NftCard
                        key={`${nft.mintAddress}-${i}`}
                        link={`/nfts/${nft.mintAddress}/details`}
                        onMakeOffer={() => makeOffer(nft.mintAddress)}
                        onBuy={() => buyNow(nft.mintAddress)}
                        nft={nft}
                      />
                    )}
                  />
                )}
              </Buyable>
            )}
          </Offerable>
        </Sidebar.Content>
      </Sidebar.Page>
    </>
  );
}

interface CollectionNftsLayout {
  children: ReactElement;
  wallet: Wallet;
}

ProfileCollected.getLayout = function ProfileCollectedLayout({
  children,
  wallet,
}: CollectionNftsLayout): JSX.Element {
  return <ProfileLayout wallet={wallet}>{children}</ProfileLayout>;
};
