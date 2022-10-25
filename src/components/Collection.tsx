import clsx from 'clsx';
import React, { ReactElement, ReactNode } from 'react';
import Price from './Price';
import { useTranslation } from 'next-i18next';
import { Nft, Maybe } from '../graphql.types';
import Icon from './Icon';
import Link from 'next/link';
import Button, { ButtonBackground, ButtonColor, ButtonSize } from './Button';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

export function Collection() {
  return <div />;
}

interface CollectionOptionProps {
  className?: string;
  selected: boolean;
  children?: ReactNode;
  avatar: JSX.Element;
  header: JSX.Element;
  floorPrice: number;
}

function CollectionOption({
  className,
  selected,
  children,
  avatar,
  header,
  floorPrice,
}: CollectionOptionProps): JSX.Element {
  const { t } = useTranslation('collection');

  return (
    <div
      className={clsx(
        'group relative mb-2 rounded-2xl border border-transparent p-px',
        selected ? 'bg-gradient' : 'border-gray-800 bg-gray-800 hover:border-white'
      )}
    >
      <div
        className={clsx(
          'flex h-full w-full cursor-pointer rounded-xl  bg-gray-800 p-2 transition ',
          className
        )}
      >
        {avatar}
        <div className="flex w-full flex-col justify-between overflow-hidden px-3">
          {header}
          <div className="flex items-end justify-between">
            <div className="-mb-1 flex flex-col">
              <span className="text-[10px] text-gray-400">{t('floorPrice')}</span>
              <Price price={floorPrice} />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

Collection.Option = CollectionOption;

interface CollectionAvatarProps {
  src: string;
  figure?: string;
}

function CollectionOptionAvatar({ src, figure }: CollectionAvatarProps): JSX.Element {
  return (
    <div className="relative flex aspect-square h-16 w-16">
      <img
        src={src}
        className="absolute top-0 left-0 h-full w-full rounded-lg object-cover"
        alt="collection avatar"
      />
      {figure && (
        <span className="min-w-6 absolute right-0 bottom-0 z-10 m-1 flex aspect-square h-6 items-center justify-center rounded bg-gray-800 text-xs text-white">
          {figure}
        </span>
      )}
    </div>
  );
}

CollectionOption.Avatar = CollectionOptionAvatar;

interface CollectedCollectionItemSkeletonProps {
  className?: string;
}

function CollectionOptionSkeleton({
  className,
}: CollectedCollectionItemSkeletonProps): JSX.Element {
  return (
    <div
      className={clsx(
        'over flex animate-pulse rounded-md border border-gray-800 p-2 transition',
        className
      )}
    >
      <div className="aspect-square h-16 w-16 rounded-md bg-gray-800" />
      <div className="flex w-full flex-col justify-between px-3">
        <div className="h-6 w-40 truncate rounded-md bg-gray-800"></div>
        <div className="flex items-end justify-between">
          <div className="flex h-8 w-16 flex-col rounded-md bg-gray-800" />
          <div className="flex h-8 w-16 flex-col rounded-md bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

CollectionOption.Skeleton = CollectionOptionSkeleton;

interface CollectionOptionEstimatedValueProps {
  amount: number;
}

function CollectionOptionEstimatedValue({
  amount,
}: CollectionOptionEstimatedValueProps): JSX.Element {
  const { t } = useTranslation('collection');

  return (
    <div className="-mb-1 flex flex-col">
      <span className="text-[10px] text-gray-400">{t('estimatedValue', { ns: 'collection' })}</span>
      <Price price={amount} />
    </div>
  );
}

CollectionOption.EstimatedValue = CollectionOptionEstimatedValue;

function CollectionOptionTitle({ children }: { children: ReactNode }): JSX.Element {
  return <h6 className="text-md truncate">{children}</h6>;
}

CollectionOption.Title = CollectionOptionTitle;

interface CollectionCardProps {
  name: string;
  image: string;
  floorPrice: Maybe<string> | undefined;
  nftCount: Maybe<string> | undefined;
}

export default function CollectionCard({
  name,
  image,
  floorPrice,
  nftCount,
}: CollectionCardProps): JSX.Element {
  const { t } = useTranslation(['collection', 'common']);

  return (
    <div className="relative flex aspect-square w-full flex-col justify-end overflow-hidden rounded-md shadow-lg transition hover:scale-[1.02]">
      <img
        src={image}
        className="absolute top-0 left-0 h-full w-full object-cover"
        alt={`Collection ${name}`}
      />
      <div className="pointer-events-none absolute z-10 h-full w-full bg-gradient-to-b from-transparent to-gray-900/80" />
      <h1 className="z-20 px-4 text-3xl">{name}</h1>
      <div className="z-20 grid w-full grid-cols-2 gap-2 p-4 text-white">
        <div className=" flex flex-col justify-center rounded-md bg-gray-800 bg-opacity-50 p-2 text-center text-sm backdrop-blur-md xl:text-base">
          <span className="text-xs text-gray-300">{t('card.supply')}</span>
          <div className="flex items-center justify-center">
            <Icon.Sol /> {nftCount}
          </div>
        </div>
        <div className=" flex flex-col justify-center rounded-md bg-gray-800 bg-opacity-50 p-2 text-center text-sm backdrop-blur-md xl:text-base">
          <span className="text-xs text-gray-300">{t('card.floor')}</span>
          <div className="flex items-center justify-center">
            <Icon.Sol /> {floorPrice}
          </div>
        </div>
      </div>
    </div>
  );
}

Collection.Card = CollectionCard;

export interface CollectionCardSkeletonProps {
  className?: string;
}

CollectionCard.Skeleton = function CollectionCardSkeleton({
  className,
}: CollectionCardSkeletonProps): JSX.Element {
  return <div className={clsx('aspect-square animate-pulse rounded-md bg-gray-800', className)} />;
};

interface CollectionListProps {
  children?: ReactNode;
}
function CollectionList({ children }: CollectionListProps) {
  return (
    <div className="scrollbar-thumb-rounded-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-900 lg:pb-0">
      <div className="w-full">{children}</div>
    </div>
  );
}

Collection.List = CollectionList;

function CollectionListLoading() {
  return (
    <div className="mb-2 flex items-center gap-4 rounded-2xl bg-gray-800 p-4 md:px-6 lg:gap-7">
      {/* Collection Image */}
      <div className="h-16 w-16 rounded-lg bg-gray-725 md:h-12 md:w-12" />
      <div className="flex w-full flex-col justify-between gap-2 py-1 md:flex-row md:items-center lg:gap-8">
        {/* Collection Name */}
        <div className="lg:w-40">
          <div className="h-6 w-20 rounded-md bg-gray-725" />
        </div>
        {/* Data Points */}
        <div className="flex lg:w-96 lg:justify-between lg:gap-8">
          <div className="flex w-28 flex-col gap-1 sm:w-full">
            <div className="h-5 w-20 rounded-md bg-gray-725" />
            <div className="h-5 w-20 rounded-md bg-gray-725" />
          </div>
          <div className="flex w-28 flex-col gap-1 sm:w-full">
            <div className="h-5 w-20 rounded-md bg-gray-725" />
            <div className="h-5 w-20 rounded-md bg-gray-725" />
          </div>
          <div className="flex w-28 flex-col gap-1 sm:w-full">
            <div className="h-5 w-20 rounded-md bg-gray-725" />
            <div className="h-5 w-20 rounded-md bg-gray-725" />
          </div>
        </div>
        {/* Nfts */}
        <div className="hidden gap-4 lg:flex">
          <div className="h-16 w-16 rounded-lg bg-gray-725" />
          <div className="h-16 w-16 rounded-lg bg-gray-725" />
          <div className="h-16 w-16 rounded-lg bg-gray-725" />
        </div>
      </div>
    </div>
  );
}

CollectionList.Loading = CollectionListLoading;

interface CollectionListRowProps {
  id: String;
  children?: ReactNode;
}
function CollectionListRow({ children, id }: CollectionListRowProps) {
  return (
    <Link href={`/collections/${id}`}>
      <a className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-800 px-4 py-4 text-white md:px-6 lg:gap-7">
        {children}
      </a>
    </Link>
  );
}

CollectionList.Row = CollectionListRow;

interface CollectionListColProps {
  className?: String;
  children?: ReactNode;
}
function CollectionListCol({ children, className }: CollectionListColProps) {
  return <div className={clsx(className)}>{children}</div>;
}

CollectionList.Col = CollectionListCol;

interface CollectionListDataPointProps {
  icon?: ReactElement;
  name: string;
  value: Maybe<string> | undefined;
  status?: ReactElement;
  className?: string;
}
function CollectionListDataPoint({ icon, name, value, status }: CollectionListDataPointProps) {
  return (
    <div className="flex w-28 flex-col gap-1 sm:w-full">
      <div className="text-xs text-gray-250 md:text-sm">{name}</div>
      <div className="flex w-32 flex-row items-center justify-start gap-2">
        <p className="flex items-center text-sm font-semibold md:text-base">
          {icon}
          {value}
        </p>
        {status}
      </div>
    </div>
  );
}

CollectionList.DataPoint = CollectionListDataPoint;

interface CollectionListDataPointStatusProps {
  value: Maybe<number> | undefined;
}
function CollectionListDataPointStatus({ value }: CollectionListDataPointStatusProps) {
  if (!value) {
    return <div></div>
  }

  return (
    <p
      className={clsx(clsx, 'flex items-center gap-1 text-xs md:text-sm', {
        'text-[#12B76A]': value >= 0,
        'text-[#F04438]': value < 0,
      })}
    >
      {Math.abs(value)}%
      <ArrowUpIcon
        className={clsx(clsx, 'h-2 w-2', {
          'rotate-180 transform': value < 0,
          'rotate-0 transform': value >= 0,
        })}
      />
    </p>
  );
}

CollectionListDataPoint.Status = CollectionListDataPointStatus;

interface CollectionListShowcaseNftProps {
  image: string;
  name: string;
  price: number;
}
function CollectionListShowcaseNft({ image, name, price }: CollectionListShowcaseNftProps) {
  return (
    <div className="group flex w-16 flex-col items-center hover:scale-110">
      <img src={image} alt={name} className="h-16 w-16 rounded-lg object-cover" />
      <Button
        icon={<Icon.Sol className="h-3 w-3" />}
        color={ButtonColor.Gray}
        background={ButtonBackground.Slate}
        size={ButtonSize.Tiny}
        className="-mt-3 shadow-lg shadow-black group-hover:hidden"
      >
        {price}
      </Button>
      <Button size={ButtonSize.Small} className="-mt-3 hidden group-hover:block">
        Buy
      </Button>
    </div>
  );
}

CollectionList.ShowcaseNft = CollectionListShowcaseNft;
