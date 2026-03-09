from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pathlib import Path

class VectorStoreBuilder:

    def __init__(self,csv_path:str,persist_dir: str = "chroma_db"):
        self.csv_path = Path(csv_path).resolve()
        self.persist_dir = Path(persist_dir).resolve()
        self.persist_dir.mkdir(parents=True,exist_ok=True)

        self.embedding = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    def build_and_save_vectorstore(self):

        loader = CSVLoader(
            self.csv_path,
            encoding="utf-8",
            metadata_columns=[]
        )

        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter(chunk_size=1000,chunk_overlap=0)

        chunks = splitter.split_documents(documents)

        db = Chroma.from_documents(
            chunks,
            self.embedding,
            persist_directory=str(self.persist_dir)
        )

        db.persist()


    def load_vector_store(self):
        return Chroma(
            persist_directory=str(self.persist_dir),
            embedding_function=self.embedding
        )
    
        