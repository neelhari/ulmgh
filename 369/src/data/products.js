import imgBrassDiya from '../assets/brass_diya.png';
import imgSilverThali from '../assets/silver_thali.png';
import imgGaneshaIdol from '../assets/ganesha_idol.png';
import imgAgarbatti from '../assets/agarbatti.png';
import imgCamphor from '../assets/camphor.png';

export const products = [
  {
    id: 'p1',
    name: 'Pure Brass Kuber Diya',
    categoryId: 'diyas',
    price: 450,
    originalPrice: 600,
    discountPercent: 25,
    rating: 4.8,
    reviewsCount: 124,
    image: imgBrassDiya,
    brand: 'Divine Heritage',
    isFeatured: true,
    description: 'Handcrafted pure brass Kuber diya for daily pooja. Thick brass ensures it does not heat up quickly.',
    highlights: ['Pure Brass', 'Handcrafted', 'Long-lasting'],
    sizes: ['Small', 'Medium', 'Large']
  },
  {
    id: 'p2',
    name: 'Pure Silver Pooja Thali Set',
    categoryId: 'pooja-kits',
    price: 5500,
    originalPrice: null,
    discountPercent: 0,
    rating: 4.9,
    reviewsCount: 56,
    image: imgSilverThali,
    brand: 'Silver Touch',
    isFeatured: true,
    description: 'A complete 5-piece pure silver pooja thali set including diya, bell, incense holder, and kumkum dibbi.',
    highlights: ['99.9% Pure Silver', 'Hallmarked', 'Complete Set'],
    sizes: ['Standard']
  },
  {
    id: 'p3',
    name: 'Antique Brass Ganesha Idol',
    categoryId: 'idols',
    price: 1200,
    originalPrice: 1500,
    discountPercent: 20,
    rating: 4.7,
    reviewsCount: 89,
    image: imgGaneshaIdol,
    brand: 'Artisan Crafted',
    isFeatured: true,
    description: 'Intricately detailed Lord Ganesha idol in antique brass finish. Perfect for home temple or gifting.',
    highlights: ['Antique Finish', 'Detailed Carving', 'Heavy Base'],
    sizes: ['4 inch', '6 inch', '8 inch']
  },
  {
    id: 'p4',
    name: 'Premium Sandalwood Agarbatti',
    categoryId: 'agarbatti',
    price: 150,
    originalPrice: 200,
    discountPercent: 25,
    rating: 4.5,
    reviewsCount: 210,
    image: imgAgarbatti,
    brand: 'Aroma Bliss',
    isFeatured: true,
    description: '100% natural sandalwood incense sticks. Charcoal-free and low smoke.',
    highlights: ['Charcoal Free', 'Natural Oils', 'Long Lasting'],
    sizes: ['100g', '250g']
  },
  {
    id: 'p5',
    name: 'Pure Bhimseni Camphor (Kapoor)',
    categoryId: 'camphor',
    price: 250,
    originalPrice: null,
    discountPercent: 0,
    rating: 4.9,
    reviewsCount: 340,
    image: imgCamphor,
    brand: 'Pure Essence',
    isFeatured: true,
    description: 'Edible grade pure Bhimseni camphor. Burns completely without leaving any residue.',
    highlights: ['No Residue', 'Edible Grade', 'Strong Aroma'],
    sizes: ['50g', '100g', '500g']
  },
  {
    id: 'p6',
    name: 'Traditional Brass Pooja Bell (Ghanti)',
    categoryId: 'bells',
    price: 350,
    originalPrice: 450,
    discountPercent: 22,
    rating: 4.8,
    reviewsCount: 112,
    image: imgGaneshaIdol, // using existing image as placeholder
    brand: 'Divine Heritage',
    isFeatured: false,
    description: 'Heavy brass pooja bell with a clear, resonant sound that lingers.',
    highlights: ['Clear Sound', 'Heavy Brass', 'Traditional Design'],
    sizes: ['Small', 'Large']
  },
  {
    id: 'p7',
    name: 'Organic Red Kumkum (Roli)',
    categoryId: 'kumkum',
    price: 99,
    originalPrice: 150,
    discountPercent: 34,
    rating: 4.6,
    reviewsCount: 88,
    image: imgSilverThali, // placeholder
    brand: 'Pure Essence',
    isFeatured: false,
    description: 'Chemical-free, skin-safe pure turmeric-based red kumkum for daily tilak.',
    highlights: ['Skin Safe', 'Organic', 'Turmeric Base'],
    sizes: ['50g']
  },
  {
    id: 'p8',
    name: 'Complete Diwali Pooja Kit',
    categoryId: 'pooja-kits',
    price: 899,
    originalPrice: 1200,
    discountPercent: 25,
    rating: 4.9,
    reviewsCount: 45,
    image: imgBrassDiya, // placeholder
    brand: 'Divine Heritage',
    isFeatured: false,
    description: 'Everything you need for Diwali pooja in one box. Includes 21 items.',
    highlights: ['21 Items', 'Premium Quality', 'Ready to use'],
    sizes: ['Standard Box']
  },
  {
    id: 'p9',
    name: '5 Mukhi Nepali Rudraksha Mala',
    categoryId: 'rudraksha',
    price: 1800,
    originalPrice: 2500,
    discountPercent: 28,
    rating: 4.7,
    reviewsCount: 67,
    image: imgAgarbatti, // placeholder
    brand: 'Spiritual Beads',
    isFeatured: false,
    description: 'Lab-certified 108+1 bead pure Nepali 5-mukhi Rudraksha mala.',
    highlights: ['Lab Certified', '108 Beads', 'Original Nepali'],
    sizes: ['Standard']
  },
  {
    id: 'p10',
    name: 'Fresh Marigold Garland (Set of 2)',
    categoryId: 'flowers',
    price: 120,
    originalPrice: null,
    discountPercent: 0,
    rating: 4.5,
    reviewsCount: 30,
    image: imgCamphor, // placeholder
    brand: 'Fresh Blooms',
    isFeatured: false,
    description: 'Freshly plucked, tightly woven orange and yellow marigold garlands. Next day delivery.',
    highlights: ['Farm Fresh', 'Thick Weave', 'Aromatic'],
    sizes: ['1 Meter', '2 Meters']
  }
];
