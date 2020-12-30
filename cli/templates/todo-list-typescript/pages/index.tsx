import dynamic from "next/dynamic";

const Todo = dynamic(() => import("../components/Todo"), { ssr: false });

const IndexPage = () => {
  return <Todo />;
};

export default IndexPage;
