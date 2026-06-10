import { ListingFeedItem } from '../domain/listing-feed-item';

export const mockListings: ListingFeedItem[] = [
  {
    id: 'highvill-65',
    title: '2-комн. квартира, 65 м²',
    address: 'ЖК Highvill, ул. Керей Жанибек, 12/1',
    priceLabel: '280 000 ₸ / мес',
    realtorName: 'Алия С.',
    realtorPhone: '+77011234567',
    listingPhone: '+77072345678',
    description: 'Сдается уютная 2-комнатная квартира в ЖК Highvill.',
    ratingLabel: '4.9',
    reviewsCount: 128,
    statusLabel: 'Не сдано',
    imageUrl:
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=85',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=85',
        type: 'photo',
        sortOrder: 0,
      },
    ],
    reviews: [
      { id: '1', authorName: 'Айгерим Т.', text: 'Отличная квартира, все как на фото!', rating: 5 },
      { id: '2', authorName: 'Нурлан Б.', text: 'Чисто, уютно и удобная локация.', rating: 5 },
    ],
  },
  {
    id: 'samal-45',
    title: '1-комн. квартира, 45 м²',
    address: 'ЖК Alpamys, пр. Туран, 50',
    priceLabel: '180 000 ₸ / мес',
    realtorName: 'Ерлан М.',
    realtorPhone: '+77011234567',
    listingPhone: '+77018889900',
    description: 'Светлая квартира для одного человека или пары.',
    ratingLabel: '4.8',
    reviewsCount: 44,
    statusLabel: 'Сдано',
    imageUrl:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85',
        type: 'photo',
        sortOrder: 0,
      },
    ],
    reviews: [
      { id: '1', authorName: 'Дана К.', text: 'Быстрый показ и честное описание.', rating: 5 },
    ],
  },
] as const;
