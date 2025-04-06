import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import "./ListaCompras.css";

const ListaCompras = () => {
  const [horaAtual, setHoraAtual] = useState(new Date().toLocaleTimeString("pt-BR"));
  const [novoItem, setNovoItem] = useState({ nome: "", quantidade: "", preco: "" });
  const [itens, setItens] = useState([]);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [ultimaAlteracao, setUltimaAlteracao] = useState("");
  const [nomeLista, setNomeLista] = useState("ListaPadrao");
  const [listasDisponiveis, setListasDisponiveis] = useState([]);
  const [ordem, setOrdem] = useState("nome");
  const [orcamentos, setOrcamentos] = useState({});
  const [temaEscuro, setTemaEscuro] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString("pt-BR"));
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const buscarListas = async () => {
      const snapshot = await getDocs(collection(db, "listas"));
      const nomes = snapshot.docs.map((doc) => doc.id);
      setListasDisponiveis(nomes.length ? nomes : ["ListaPadrao"]);
    };
    buscarListas();
  }, []);

  useEffect(() => {
    const carregarItens = async () => {
      const snapshot = await getDocs(collection(db, "listas", nomeLista, "itens"));
      const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItens(dados);
      setUltimaAlteracao(new Date().toLocaleString("pt-BR"));

      const docRef = doc(db, "listas", nomeLista);
      const listaDoc = await getDoc(docRef);
      if (listaDoc.exists()) {
        const data = listaDoc.data();
        if (data.orcamento !== undefined) {
          setOrcamentos((prev) => ({ ...prev, [nomeLista]: data.orcamento }));
        }
      }
    };
    carregarItens();
  }, [nomeLista]);

  const adicionarItem = async () => {
    if (!novoItem.nome.trim()) return;
    const item = {
      ...novoItem,
      quantidade: parseInt(novoItem.quantidade) || 1,
      preco: parseFloat(novoItem.preco) || 0,
    };
    const docRef = await addDoc(collection(db, "listas", nomeLista, "itens"), item);
    setItens([...itens, { ...item, id: docRef.id }]);
    setNovoItem({ nome: "", quantidade: "", preco: "" });

    await setDoc(doc(db, "listas", nomeLista), {
      atualizadoEm: serverTimestamp(),
    }, { merge: true });
  };

  const atualizarItem = async (index, key, value) => {
    const atualizados = [...itens];
    const itemAtualizado = { ...atualizados[index], [key]: value };
    atualizados[index] = itemAtualizado;
    setItens(atualizados);

    const ref = doc(db, "listas", nomeLista, "itens", itemAtualizado.id);
    await updateDoc(ref, itemAtualizado);

    await setDoc(doc(db, "listas", nomeLista), {
      atualizadoEm: serverTimestamp(),
    }, { merge: true });
  };

  const excluirItem = async (index) => {
    const item = itens[index];
    const confirmar = window.confirm(`Tem certeza que deseja excluir "${item.nome}"?`);
    if (!confirmar) return;

    await deleteDoc(doc(db, "listas", nomeLista, "itens", item.id));
    setItens(itens.filter((_, i) => i !== index));

    await setDoc(doc(db, "listas", nomeLista), {
      atualizadoEm: serverTimestamp(),
    }, { merge: true });
  };

  const criarNovaLista = async () => {
    const nome = prompt("Digite o nome da nova lista:");
    if (nome && !listasDisponiveis.includes(nome)) {
      await setDoc(doc(db, "listas", nome), {
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        orcamento: 0,
      });
      setNomeLista(nome);
      setItens([]);
      setListasDisponiveis([...listasDisponiveis, nome]);
    }
  };

  const editarNomeLista = async () => {
    const novoNome = prompt("Digite o novo nome da lista:", nomeLista);
    if (novoNome && novoNome !== nomeLista) {
      const itensAtual = await getDocs(collection(db, "listas", nomeLista, "itens"));
      const orcamentoAtual = orcamentos[nomeLista] || 0;

      await setDoc(doc(db, "listas", novoNome), {
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        orcamento: orcamentoAtual,
      });

      for (let docSnap of itensAtual.docs) {
        await setDoc(doc(db, "listas", novoNome, "itens", docSnap.id), docSnap.data());
      }

      await deleteDoc(doc(db, "listas", nomeLista));
      setListasDisponiveis(listasDisponiveis.filter((l) => l !== nomeLista).concat(novoNome));
      setNomeLista(novoNome);
    }
  };

  const excluirLista = async () => {
    const confirmacao = window.confirm(`Tem certeza que deseja excluir a lista "${nomeLista}"?`);
    if (confirmacao) {
      const snapshot = await getDocs(collection(db, "listas", nomeLista, "itens"));
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "listas", nomeLista, "itens", docSnap.id));
      });
      await deleteDoc(doc(db, "listas", nomeLista));

      const novasListas = listasDisponiveis.filter((l) => l !== nomeLista);
      setListasDisponiveis(novasListas.length ? novasListas : ["ListaPadrao"]);
      setNomeLista(novasListas[0] || "ListaPadrao");
    }
  };

  const calcularTotal = () =>
    itens.reduce((total, item) => total + item.quantidade * item.preco, 0).toFixed(2);

  const saldoRestante = () => {
    const orcamentoAtual = orcamentos[nomeLista] || 0;
    return (orcamentoAtual - parseFloat(calcularTotal())).toFixed(2);
  };

  const itensOrdenados = [...itens].sort((a, b) => {
    if (ordem === "nome") return a.nome.localeCompare(b.nome);
    if (ordem === "preco") return b.preco - a.preco;
    if (ordem === "quantidade") return b.quantidade - a.quantidade;
    return 0;
  });

  const handleOrcamentoChange = async (e) => {
    const valor = parseFloat(e.target.value) || 0;
    setOrcamentos((prev) => ({ ...prev, [nomeLista]: valor }));

    await setDoc(doc(db, "listas", nomeLista), {
      orcamento: valor,
      atualizadoEm: serverTimestamp(),
    }, { merge: true });
  };

  return (
    <div className="container" data-theme={temaEscuro ? "dark" : "light"}>
      <header className="header">
        <h1>Lista de Compras 🛒</h1>
        <div className="relogio-digital">
          <h1>🕒 {horaAtual}</h1>
        </div>
        <button className="botao-tema" onClick={() => setTemaEscuro(!temaEscuro)}>
          {temaEscuro ? "🌞 Claro" : "🌙 Escuro"}
        </button>
      </header>

      <section className="configuracoes">
        <div className="listas">
          <label>Lista:</label>
          <select value={nomeLista} onChange={(e) => setNomeLista(e.target.value)}>
            {listasDisponiveis.map((lista, index) => (
              <option key={index} value={lista}>{lista}</option>
            ))}
          </select>
          <button onClick={criarNovaLista}>➕</button>
          <button onClick={editarNomeLista}>✏️</button>
          <button onClick={excluirLista}>🗑️</button>
        </div>

        <div className="orcamento">
          <label>Orçamento: R$</label>
          <input
            type="number"
            min="0"
            value={orcamentos[nomeLista] || 0}
            onChange={handleOrcamentoChange}
          />
          <p className={`saldo ${saldoRestante() < 0 ? "negativo" : "positivo"}`}>
            Saldo restante: R$ {saldoRestante()}
          </p>
        </div>

        <div className="ordenacao">
          <label>Ordenar por:</label>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="nome">Nome</option>
            <option value="preco">Preço</option>
            <option value="quantidade">Quantidade</option>
          </select>
        </div>
      </section>

      <section className="entrada-itens">
        <input
          type="text"
          placeholder="Item"
          value={novoItem.nome}
          onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
        />
        <input
          type="number"
          min="1"
          placeholder="Qtd"
          value={novoItem.quantidade}
          onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Preço R$"
          value={novoItem.preco}
          onChange={(e) => setNovoItem({ ...novoItem, preco: e.target.value })}
        />
        <button onClick={adicionarItem}>Adicionar ⭐</button>
      </section>

      <section className="lista-itens">
        <ul>
          {itensOrdenados.map((item, index) => (
            <li key={item.id}>
              {editandoIndex === index ? (
                <>
                  <input
                    type="text"
                    value={item.nome}
                    onChange={(e) => atualizarItem(index, "nome", e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(index, "quantidade", parseInt(e.target.value) || 1)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.preco}
                    onChange={(e) => atualizarItem(index, "preco", parseFloat(e.target.value) || 0)}
                  />
                  <button onClick={() => setEditandoIndex(null)}>✅</button>
                  <button onClick={() => excluirItem(index)}>❌</button>
                </>
              ) : (
                <>
                  <span onClick={() => setEditandoIndex(index)}>
                    <strong>{item.nome}</strong> - {item.quantidade}x R$ {item.preco.toFixed(2)} ={" "}
                    <strong>R$ {(item.quantidade * item.preco).toFixed(2)}</strong>
                  </span>
                  <button onClick={() => setEditandoIndex(index)}>✏️</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <footer className="resumo">
        <h3>Total da Compra: R$ {calcularTotal()}</h3>
        {ultimaAlteracao && <p className="ultima-alteracao">Última alteração: {ultimaAlteracao}</p>}
      </footer>
    </div>
  );
};

export default ListaCompras;
