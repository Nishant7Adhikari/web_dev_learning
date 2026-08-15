import Link from 'next/link';
import ProductCard from '../components/product-card'

export default function Home() {
  return (
    <main>
      <ProductCard name="Ferrari" description="Really good car, just make sure your bank balance covers you insurance"/>
      <ProductCard name="Tesla" description="Made by your friendly neighborhood Eal On Musk" />
    </main>
  );
}
