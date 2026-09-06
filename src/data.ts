import { Product, Order, VendorApplication, Dispute } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Pure Shea Nectar',
    category: 'Oils',
    categoryLabel: 'Oils • Kano Origin',
    origin: 'Kano Origin',
    price: 9600,
    priceFormatted: '₦9,600',
    rating: 4.9,
    reviewsCount: 154,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxqz9AD4QcknO2_kt2PGQ7UhnGq2avx_OIG1msUaOC6bQTBSxCRH8_8V044mfOaahwbA28v5VecG8gpKqAd9xu34w-QSbqOx09IhwbT1W_nAu3pG6nrjhb-uwB4WFQy71XcGOiLcOm7ikfgj7-07cBYmSUq3Xi2Ly8wZkwk-kenlBQjbVDzrFJqVQcbi1j_GEyBT8RQqmF4CrK2Sk-vNeZgK4fezz08LbihX4OFOErc3Yxx3HOXYErlA',
    badge: 'Best Seller',
    tags: ['Organic', 'Cold Pressed', 'Nourishing'],
    vendorName: "Amina's Traditional Snacks",
    vendorOrders: 482,
    vendorRating: '4.9',
    stock: 15
  },
  {
    id: 'p2',
    name: 'Sieved Sorghum Flour Mix (Gluten-Free)',
    category: 'Grains',
    categoryLabel: 'Grains • Jos Plateau',
    origin: 'Jos Plateau',
    price: 7400,
    priceFormatted: '₦7,400',
    rating: 4.7,
    reviewsCount: 92,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCzV9m_X0rVFGP8k77nDvM2-WYWBU2SYpJPp4QqlenIytXaUMCUB4iHZy-P8CEH8gUrioF3-cT0bMuegMdXSFNHQEr7sFWa4k9SxXRQBD_juoMRNSC3FfGPdO3EWF32mIbFsu13y3Fh2CG8rx8iTuLwRN1oSiYUNhpdUEReLfKKAYFTXjSEizvEsADuOd-p1uFw4C3cD2EAFCiNsn04HMk9F0mO_aDwo-EH05MjkcKyWNjgW5ekOoUvA',
    tags: ['Milled & Sifted', 'Heritage Grain', 'Non-GMO'],
    vendorName: 'Northern Delights Ltd.',
    vendorOrders: 1200,
    vendorRating: '4.7',
    stock: 12
  },
  {
    id: 'p3',
    name: 'Sun-Dried Chili Flakes',
    category: 'Spices',
    categoryLabel: 'Spices • Northern Belt',
    origin: 'Northern Belt',
    price: 4800,
    priceFormatted: '₦4,800',
    rating: 5.0,
    reviewsCount: 61,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVb8zZjHJpJ9G2aGASeWs7lJk_UK7uVarVkv_chthQZIfCh7Mg3ED8m44FxeZsLolgtISw6JPxYa_h9CF82xq5TKQJ7tpIW3CdeGZAfcWCyzL_uhgZjexo6Z3PXEiswMahAKjtKmg9utu2bjrInOSojsXHVE8CGAIQJv6zHTTxcYkIPTx6uRj6fJRqy8VpPfnbh7jPoT9zd9NJRN3ejNGNWIGMlS8DHAZdqUZ4p2mO5NrAUwtATRiR3A',
    badge: 'Limited Stock',
    tags: ['Hand-Crafted', 'Spicy', 'Organic'],
    vendorName: 'Savannah Spices',
    vendorOrders: 120,
    vendorRating: '4.5',
    stock: 4
  },
  {
    id: 'p4',
    name: 'Roasted Cashew Trio',
    category: 'Snacks',
    categoryLabel: 'Snacks • Coastal Groves',
    origin: 'Coastal Groves',
    price: 6400,
    priceFormatted: '₦6,400',
    rating: 4.8,
    reviewsCount: 204,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFCS8j_qeByKF1x0EK_HhvJaddr7IW8YmDWJnKMbq06oyQZBx1vVjUXwjUZZWEgoXx6FKoMh6t6s9YrU-VzN5bSQFIISViII-bLu6yGGw8XjPBrX_bXmjA0Cwm04F2xG9fQKyFfBL7RWoRz9AVhgxs_qZsDKBYviGappbOTlGR_sN5GIWsdVbGJVfWXDnzrqdc16sP4Xdp_1yrIemQBslVMgwnYZNMTS9sKwUT08_GRt_OMBG-zvfHOQ',
    tags: ['Premium', 'Oven Roasted', 'Lightly Salted'],
    vendorName: "Amina's Traditional Snacks",
    vendorOrders: 482,
    vendorRating: '4.9',
    stock: 20
  },
  {
    id: 'p5',
    name: 'Crunchy Kuli-Kuli Sticks (Spiced Peanut Roast)',
    category: 'Snacks',
    categoryLabel: 'Snacks • Kaduna Origin',
    origin: 'Kaduna State',
    price: 2400,
    priceFormatted: '₦2,400',
    rating: 4.9,
    reviewsCount: 182,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrW72LPNXIAasQGWN100SOkjVy-c7L2ccdNtl-LbkzTfeuXb4ag6jYSSKosw_-RaHNsstwEUoIYVNDYrafOJ8C4RzVf0iJ6dg2Y-fG792EoZP7t4EFaYS9p36cCdq3PsTznwpNFvwGYkIe8HTakiztV2--PDBSMhESEZHGqfGDz9rkrdwQmk2HS8P5lMo8KR7ca7Q3qSPJHEIHLioxHmSkZ1A32zQ3lhFadaQHwCspAGX4i4Bv-3bdbg',
    badge: 'Bestseller',
    tags: ['Crunchy Sticks', 'Spiced Peanut Roast', 'Traditional Recipe', 'Gluten Free'],
    vendorName: "Amina's Traditional Snacks",
    vendorOrders: 482,
    vendorRating: '4.9',
    stock: 35
  },
  {
    id: 'p6',
    name: 'Honey Roasted Groundnut Clusters',
    category: 'Snacks',
    categoryLabel: 'Snacks • Kano Origin',
    origin: 'Kano State',
    price: 3150,
    priceFormatted: '₦3,150',
    rating: 4.7,
    reviewsCount: 310,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3P9QImkFo7KnHNgOtBYoRC7qj1kvE1wpO-QyZar7VI25LAY6jbecAwPViWGMkKezza1-Y80JdPemL_x3ExnKkITFi0RyqankgAqDxCPFJ6iF5kvCBBpvBAPKQTjZbVW1WOQ_iJNCtLoUgLufoCsu8gVSMfMniUrtldSSnkp9-4rzkxKtCNh7nMbC4HxWz1LZm19kRyjcO4Y_FmZGJSQ3rTC0YSNktU7lzoK4K40_8FBV_QWiYNbK6cQ',
    tags: ['Honey-Glazed', 'Sweet & Crunchy', '100% Natural'],
    vendorName: 'Northern Delights Ltd.',
    vendorOrders: 1200,
    vendorRating: '4.7',
    stock: 25
  },
  {
    id: 'p7',
    name: 'Rough-Crushed Spiced Ginger & Turmeric Flakes',
    category: 'Spices',
    categoryLabel: 'Spices • Kaduna Origin',
    origin: 'Kaduna State',
    price: 1800,
    priceFormatted: '₦1,800',
    rating: 4.5,
    reviewsCount: 78,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuCfFpnZVWOLDnVWnClOQeAf02Brh1srLcuo2hwiucAyhcie25p_Ksf1ciPZju7lTj3-eBndVnMruvhSXQ90zFnKncQwWr_i73cdUgVZwq15OLrq12-CU0CWFtSmzeJ7rNAr5Or79-e-gRHUi51zYYw_pGzL4xX9eW9186h1EckAO76cn86gVyEnW_IOPRuR1q1NM9uYFBJwWGu8zBoH-mfgv6Qyn-TqCYzM2T0qm-26fKZV97KcXDkQ',
    tags: ['Sun-Dried Flakes', 'Rough Chunks', 'Aromatic & Spicy'],
    vendorName: 'Savannah Spices',
    vendorOrders: 120,
    vendorRating: '4.5',
    stock: 18
  },
  {
    id: 'p8',
    name: 'Cold-pressed Moringa Oil',
    category: 'Oils',
    categoryLabel: 'Oils • Kano Origin',
    origin: 'Kano State',
    price: 12500,
    priceFormatted: '₦12,500',
    originalPrice: 15000,
    originalPriceFormatted: '₦15,000',
    rating: 4.9,
    reviewsCount: 128,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6VvNO_NiOlvE7sSL-7pkwxVYc8mECNTZWhXLlplpjlQs-pFbuHM3jQXWEI3SJvfHXDUHrPb20QEIoaedCNDCzkByZDV_Vj5Kkbkk_1OuexiG9zWYNVLipGUZiti7jjbq1z-dKEg3MxJJIzLpey02ISZnqqw9NK2oLyPHrEwBL77AETrqYZRJLxij_k6YWFLbcDfKZcX8X0IoCV8vAn0UEILpC7JiGbG1RPU9KH-H79b8skVO0O4zj5g',
    badge: 'Organic',
    tags: ['100% Organic', 'Kano Origin', 'Cold Pressed', 'Artisan Crafted'],
    vendorName: 'High-Plains Apiary',
    vendorOrders: 640,
    vendorRating: '4.8',
    stock: 8
  },
  {
    id: 'p9',
    name: 'Extra Virgin Olive Oil',
    category: 'Oils',
    categoryLabel: 'Oils • Crete Origin',
    origin: 'Plateau (Jos)',
    price: 9600,
    priceFormatted: '₦9,600',
    rating: 4.9,
    reviewsCount: 88,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAd_pIwuEL8hYC6f8E29gRifjmmpmPxvs4UxnNtwQTiUu2Q3tHBSzepFXQByUEGXjbbsDH4sZZWm5Et3qiqjKnEOYoe6v_bkPqZOXxu5RkAP1tdMgpNJ1Xl3bjaLNjNns_LHixrKxnG3htbY9WocYsheoid88WOHqpEOu0XVYLgyR8YTx5a7WlWhuQnaQBFqO3EBhsosehez0VvgqwEN3RL3ZyfhZXt2nVyzcoSYleZdmpJFJR6JV4JCg',
    tags: ['Crete Origin', 'Extra Virgin', 'Artisanal'],
    vendorName: 'Nectar Haven',
    vendorOrders: 320,
    vendorRating: '4.9',
    stock: 15
  },
  {
    id: 'p10',
    name: 'Dark Roast Coffee',
    category: 'Grains',
    categoryLabel: 'Grains • Kano Origin',
    origin: 'Kano State',
    price: 7400,
    priceFormatted: '₦7,400',
    rating: 4.8,
    reviewsCount: 95,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB011OHqsnE98aEL2u8Vef3dq7s29wUBAI3qY0eJAUrgN9crbP0Ad848OZz5WRM1eF_Il9K1_7DhhCIffZJe_lHMWdmDT_A9LraYQ42atEGCyrwh97swiTCGolZ6A3Lk8TwWa1pLZso4LRquw3IVsml2lsUI53y1WgeFNvVXt3i-3lkRucUzFbWd0ew2PQuVNka-TplWZzT46QPCDl5S9xw00cjq9k74-7gV7RgYxZ_ukFMf_gp8WLUqQ',
    tags: ['Rich Aroma', 'Organic Beans', 'Bold Roast'],
    vendorName: 'Zaria Spice Hub',
    vendorOrders: 420,
    vendorRating: '4.7',
    stock: 30
  },
  {
    id: 'p11',
    name: 'Dehydrated Spiced Tomato Flakes (Sun-Dried & Packaged)',
    category: 'Spices',
    categoryLabel: 'Spices • Ibadan Origin',
    origin: 'Plateau (Jos)',
    price: 4800,
    priceFormatted: '₦4,800',
    rating: 5.0,
    reviewsCount: 42,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5z_HY19_w68EnsqwSR1TL-rDu4vtHNGPIYK7FURS-t98i3d4IihxwK1i85WmwML71eXOtddPHXXcep0XoHWDkKF2WzsKnBqDcuOGdrLlwV-3azOFzTqHPzxJPBonVr7iIob9SrL8e-dsZvN6Ix8X-DEc46w89MK3Rkj09TzfzOlfpcYVaL6E-1xZcMFLyMBucNLFdcjpo0IcL5WUl4YaVLGFLpCpKQCp6BLJJ1TisF-gvn2kJVl1kXg',
    tags: ['Dehydrated Chunks', 'Richly Spiced', 'Perfect for Stews'],
    vendorName: 'Golden Acres Farm',
    vendorOrders: 820,
    vendorRating: '4.9',
    stock: 22
  },
  {
    id: 'p12',
    name: 'Zesty Ginger & Hibiscus (Zobo) Jelly Jam',
    category: 'Snacks',
    categoryLabel: 'Snacks • Small Batch',
    origin: 'Plateau (Jos)',
    price: 3600,
    priceFormatted: '₦3,600',
    rating: 4.8,
    reviewsCount: 115,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIi4yVM-i5ODK6qEVBQAylx8DdFeRAMM2nfYtywxvNWXCj03F9PI96tkDLJkmqkNW94tPQjYXLX5xAMClpyzwz6PyBqyp1ksnHqYHwKvwKaGP5Kw8WW1JbvyKp-t2vb09I5-7TDt5FSNqqeBFRsz2FsVdwx71WBAfe0_xRHB4FNoTN8FuRYF0LZua37WZc1K3ajvShQZzZpAByjy19ldIe6j3MzP3-As_hvsyQ5Uxm16JQjAHTTe8JwQ',
    tags: ['Hibiscus Infused', 'Spicy Ginger Preserve', 'Small Batch'],
    vendorName: 'Nectar Haven',
    vendorOrders: 320,
    vendorRating: '4.9',
    stock: 14
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-88219',
    productName: 'Seasonal Veggie Box (Premium)',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDuis1K-n-Xu7O4kDA6Jdure2RkOwb-mVHY3DLaApvJCHFHxfJ29QlpuxmsTFz3oOTOxsq3PoovteWyHaEmDP0dC2TRk_vcWlVLPgxyihvpxr_U8JyfjZtrkHUy9y0_8X5NKGcsE2fyQIrtPVrUVC5gjeBzTLkYpPwVaC9BqbSdElLUSvpNa4CzOcHmmzCT7HPr6d0ifDz4heBo8ycs21xp23GjC3GMjaAsih9CP5gu3xtOO8PoabdcA',
    status: 'In Transit',
    priceFormatted: '₦18,000',
    date: 'July 11, 2026',
    location: 'Lekki Phase 1, Lagos',
    arrivalEstimate: 'Arriving by Today, 4:00 PM'
  },
  {
    id: 'ORD-88102',
    productName: 'Artisan Honey & Spices',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqYTyCV6wNHUeN9XcZRULRwbd8TdnsU4CUQ_gFVCZL7JV_YmEeNjJEmqz-f9PYYnGqoalOkWg_P2qzrDMAPd-irWTOkg-mVt-VDkyjX_SmgtTUYQJfHqRc-uNaQgj-JmnT0_NryiKZbGlEH96qxlxqNlENLiXufu-QdVdKGSrRqaT3XJKBAfI9uBi3OaCrIZ9ZP3M6OrszkJpv_O06NVE2O77X__Ev5ccj-bHakTvO2x9crVYp_fq3Pg',
    status: 'Delivered',
    priceFormatted: '₦12,800',
    date: 'July 05, 2026',
    reviewQuote: 'The honey was exceptional, perfectly packaged.'
  }
];

export const INITIAL_VENDOR_APPLICATIONS: VendorApplication[] = [
  {
    id: 'A0892',
    businessName: 'Greenfield Organic Farms',
    legalEntityName: 'Greenfield Organic Agricultural Ltd.',
    registrationNumber: 'RC-9928312',
    category: 'Organic Grains & Tubers',
    location: 'Plot 42, Agricultural Zone, Kano State, Nigeria',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9UcJOmGiQU8_nhw8X65GbOxM_UTdrpScY6CE7fKmpi3LjVzED2Uc_l8GkCCbvWVuGDqAV_BkdQaD2RhjVhxeyHQ1QtU5q2NFZYgV1lrx-W_lXnqyrA8n0bSVaymcPfI97C6tY2sOjJVOAklMJD4Ab8I8XRY6H0p35uB4kUWImjX--UX0kr_SpGvuhdQWkgXjJEsFAM5CrVGpLYAR07Y-CfoX_4-VT-TPDdlJkFS31buEZJ-luD__DkQ',
    submittedDaysAgo: 2,
    status: 'Pending',
    contactPerson: {
      name: 'Musa Ibrahim',
      role: 'Managing Director',
      email: 'm.ibrahim@greenfield.farm',
      phone: '+234 802 000 0000',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAieT0_9RjgaNGATcbUQfO5qaZegDKQo1OFAEqkm8-oIkwXXg8rfjx8kWWZyRapCP4J_G34pb7UGNJxRiGZSMjF1AGmYzpzE1tQiY2I6giCrYnpKrfUFHDKAjt4o_d6y4Xa5KW1dPFmuTO1wlpzDHLVg83heRznAFlxPl_Da97UgDb0jpzdjp8dk0SowPmeEnHYdT9Py1q5vTDIsVQyK_LjKgkb_9_ruA2x7A5G_wnM9xi0jnDHtkfDZQ'
    },
    documents: [
      { name: 'Organic Cert_2023.pdf', type: 'GlobalGAP Certified' },
      { name: 'SON_Compliance_Letter.pdf', type: 'Standard Org of Nigeria' },
      { name: 'CAC_Registration.pdf', type: 'Business Incorporation' }
    ],
    sampleInventory: [
      { name: 'Kano Red Kidney Beans', volume: '5,000 kg/mo', price: '₦1,200/kg', shelfLife: '12 Months' },
      { name: 'Organic Dried Hibiscus', volume: '2,000 kg/mo', price: '₦2,500/kg', shelfLife: '18 Months' },
      { name: 'Premium Sorghum Flour', volume: '1,500 kg/mo', price: '₦800/kg', shelfLife: '6 Months' }
    ]
  }
];

export const INITIAL_DISPUTES: Dispute[] = [
  {
    id: 'd1',
    productName: 'Organic Honey Jars (Set of 6)',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkDKe-s78sFzHX99Qv-PRtfeXzZg9VPK_ZL9YTutreJ-GeIUYJelVcMjzD_l3vUIO3iXScgJm0uS9h8ti2366xlnbw_vW7ofTHl3afsKxhYBotqw-CJ7z_jVu-V9TajYaLheDEjHh_7htc9oIkENWGtZppZUk2SW3_-HUAZ0bYMgZIpMSG1gMaH8JpHaRcwkh_DvYrGIrfVzjP5rolHUKrkqgsHFcgjuYNG5a5NNgdS6WaAcUjpTTX8g',
    orderId: 'ORD-8821',
    vendorName: 'High-Plains Apiary',
    customerName: 'Sarah Miller',
    status: 'Damaged',
    timeAgo: '2 hours ago',
    urgency: 'Urgent Action Required',
    messages: [
      {
        id: 'm1',
        sender: 'system',
        senderName: 'System',
        message: 'Dispute opened on Oct 12, 10:45 AM',
        time: '10:45 AM'
      },
      {
        id: 'm2',
        sender: 'customer',
        senderName: 'Sarah Miller',
        senderInitials: 'SM',
        message: 'The honey arrived today but two of the glass jars were completely shattered in the box. Honey was leaking everywhere. I\'ve attached photos of the damage.',
        time: '10:48 AM',
        images: [
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAQg9ZPGgNdvmolCCEpeOD6hjLNwD5I6IlDzHp4UcM0jgR87dJt_wWphjPx3UOro7weD7KcgxUwzVF_kPu9xq9NhxXSz7wleeuJ5wBFjEXxdBraqA523TIODygfnzosunM-dqm-mO383vKMwvJ7ca47grR7c7mpgcWHcpoueT8ODpZM01x6GGlbfpEtCdMOCD30VAx_6ThlieLEtpUs61TJQtcpDWK4LD5XBRkcGG0d-M9W7GQitgHoDQ',
          'https://lh3.googleusercontent.com/aida-public/AB6AXuANZ_Ljh0T_bU7ePhc6Ln4L36aozA5W-eurNxoSPQdjs0JLrSuSyyBZYclHjQ9VCT56VR6nGn4NnM12mZJr748hlgGU2ha8ttFG1DBr-KAHdfrJBteDNOvHv2TDdFmhsE419DQ7OcMxkexPpD5WwuKa39CWET-dEsvDH8WIw4mUa17CfO7RiQAP0uaKhMivWz1aPUaxKDXEwNdxASAxl53nMzvCG4Dsi_EIbL63qHKZc7g3d2R__6pj7w'
        ]
      },
      {
        id: 'm3',
        sender: 'vendor',
        senderName: 'High-Plains Apiary',
        senderInitials: 'HA',
        message: 'We apologize for this. We used our standard protective wrapping. Could you verify if the outer box was also damaged or if it looked like it was handled roughly by the carrier?',
        time: '11:30 AM'
      },
      {
        id: 'm4',
        sender: 'customer',
        senderName: 'Sarah Miller',
        senderInitials: 'SM',
        message: 'The outer box had a large dent in the side. It looks like it was crushed during transit. I am requesting a full refund for the two broken jars plus the shipping fee.',
        time: '12:15 PM'
      }
    ]
  },
  {
    id: 'd2',
    productName: 'Gourmet Smoked Cashew Butter (Set of 3)',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjWPEpK9muupui1yaKREuYmNyeV2brbktNrKIX6ZciL_FgfvChmDJrd_V19EmxpukozaRz9FJze9751F0ZlnwlaBHUE4xBmAoCKexLdrg5_tnTbD3962fXTddOH9DC4z29zbzwCWp2Gqa_Rxghc5qFxKt9XvHbNQyu6oBC_Rxq1oMVzrqI3zG9WEvIYSxmQxUrNEPtg1t1BTd3MOhIuCJvoAiITVhBRHxbHha2TlrRGqh16aINhAb12Q',
    orderId: 'ORD-9012',
    vendorName: 'Golden Acres Farm',
    customerName: 'James Thorne',
    status: 'Not Delivered',
    timeAgo: '5 hours ago',
    urgency: 'Pending Mediation',
    messages: [
      {
        id: 'm1',
        sender: 'system',
        senderName: 'System',
        message: 'Dispute opened on Oct 12, 08:30 AM',
        time: '08:30 AM'
      },
      {
        id: 'm2',
        sender: 'customer',
        senderName: 'James Thorne',
        senderInitials: 'JT',
        message: 'The package is marked as delivered, but nothing has arrived at my doorstep. I checked with neighbors too. Please assist.',
        time: '08:35 AM'
      }
    ]
  },
  {
    id: 'd3',
    productName: 'Artisan Goat Cheese Block',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmZn2y9Tobr7eKmjdgILWnb43IkOitgzCQFo92naATzXVeO86Ae-m9Pssdw_bFvNN41aB6eK6mXhMLdnn-itMswnS6yRnHqSPHNmDYE_RRSg40TVY5jynjrb9fOklgxEZSDigW6njmSAEgrVOGN_x2Tm7gzYHLJnhkPTAgLe3Ssxk_ae7cCwccKNXO7zMfEge9zeXx4MUYKu-0O5yR-jzunqXF9Q3ECGTRiSVqQWS4Wq7tp1n_2w4ksQ',
    orderId: 'ORD-7734',
    vendorName: 'Nectar Haven',
    customerName: 'Elena Rodriguez',
    status: 'Wrong Item',
    timeAgo: 'Yesterday',
    urgency: 'Pending Mediation',
    messages: [
      {
        id: 'm1',
        sender: 'system',
        senderName: 'System',
        message: 'Dispute opened on Oct 11, 02:10 PM',
        time: '02:10 PM'
      },
      {
        id: 'm2',
        sender: 'customer',
        senderName: 'Elena Rodriguez',
        senderInitials: 'ER',
        message: 'I received the herb block instead of the smoked paprika block that I ordered.',
        time: '02:15 PM'
      }
    ]
  }
];
