import Image from "next/image";
import styles from "./page.module.scss";
import { Link } from "next-view-transitions";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>Profile Page</h1>
    </div>
  );
}
