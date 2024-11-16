import Image from "next/image";
import styles from "./page.module.scss";
import { Link } from "next-view-transitions";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>Map Page</h1>
      <p>
        In this Page you'll see all the noodles on a map.
        <br />
        So you can see where the noodles are.
      </p>
    </div>
  );
}
