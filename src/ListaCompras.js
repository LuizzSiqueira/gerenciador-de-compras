import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
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
  const [novoItem, setNovoItem] = useState({ nome: "", quantidade: 1, preco: 0 });
  const [itens, setItens] = useState([]);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [ultimaAlteracao, setUltimaAlteracao] = useState("");
  const [nomeLista, setNomeLista] = useState("ListaPadrao");
  const [listasDisponiveis, setListasDisponiveis] = useState([]);

  // Relógio digital
  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString("pt-BR"));
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  // Buscar nomes das listas
  useEffect(() => {
    const buscarListas = async () => {
      const snapshot = await getDocs(collection(db, "listas"));
      const nomes = snapshot.docs.map((doc) => doc.id);
      setListasDisponiveis(nomes.length ? nomes : ["ListaPadrao"]);
    };
    buscarListas();
  }, []);

  // Carregar os itens da lista atual
  useEffect(() => {
    const carregarItens = async () => {
      const snapshot = await getDocs(collection(db, "listas", nomeLista, "itens"));
      const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItens(dados);
      setUltimaAlteracao(new Date().toLocaleString("pt-BR"));
    };
    carregarItens();
  }, [nomeLista]);

  const adicionarItem = async () => {
    if (!novoItem.nome.trim()) return;
    const item = {
      ...novoItem,
      quantidade: novoItem.quantidade || 1,
      preco: novoItem.preco || 0,
    };
    const docRef = await addDoc(collection(db, "listas", nomeLista, "itens"), item);
    setItens([...itens, { ...item, id: docRef.id }]);
    setNovoItem({ nome: "", quantidade: 1, preco: 0 });
    await setDoc(doc(db, "listas", nomeLista), { atualizadoEm: serverTimestamp() }, { merge: true });
  };

  const atualizarItem = async (index, key, value) => {
    const item = itens[index];
    const atualizados = [...itens];
    atualizados[index][key] = value;
    setItens(atualizados);
    const ref = doc(db, "listas", nomeLista, "itens", item.id);
    await updateDoc(ref, { ...item, [key]: value });
    await setDoc(doc(db, "listas", nomeLista), { atualizadoEm: serverTimestamp() }, { merge: true });
  };

  const excluirItem = async (index) => {
    const item = itens[index];
    await deleteDoc(doc(db, "listas", nomeLista, "itens", item.id));
    setItens(itens.filter((_, i) => i !== index));
    await setDoc(doc(db, "listas", nomeLista), { atualizadoEm: serverTimestamp() }, { merge: true });
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      const preco = typeof item.preco === "number" ? item.preco : 0;
      return total + item.quantidade * preco;
    }, 0).toFixed(2);
  };

  const criarNovaLista = async () => {
    const nome = prompt("Digite o nome da nova lista:");
    if (nome && !listasDisponiveis.includes(nome)) {
      await setDoc(doc(db, "listas", nome), {
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });
      setNomeLista(nome);
      setItens([]);
      setListasDisponiveis([...listasDisponiveis, nome]);
    }
  };

  return (
    <div className="container">
      <h2>Lista de Compras 🛒</h2>
      <div className="relogio-digital">🕒 Hora Atual: {horaAtual}</div>
      {ultimaAlteracao && (
        <p className="ultima-alteracao">Última alteração: {ultimaAlteracao}</p>
      )}

      <div className="lista-selecao">
        <label>Selecionar lista:</label>
        <select value={nomeLista} onChange={(e) => setNomeLista(e.target.value)}>
          {listasDisponiveis.map((lista, index) => (
            <option key={index} value={lista}>
              {lista}
            </option>
          ))}
        </select>
        <button onClick={criarNovaLista}>➕ Nova Lista</button>
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="Digite um item"
          value={novoItem.nome}
          onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
        />
        <input
          type="number"
          min="1"
          value={novoItem.quantidade}
          onChange={(e) =>
            setNovoItem({ ...novoItem, quantidade: parseInt(e.target.value) || 1 })
          }
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Preço R$"
          value={novoItem.preco}
          onChange={(e) =>
            setNovoItem({ ...novoItem, preco: parseFloat(e.target.value) || 0 })
          }
        />
        <button onClick={adicionarItem}>Adicionar</button>
      </div>

      <ul>
        {itens.map((item, index) => (
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
                  onChange={(e) =>
                    atualizarItem(index, "quantidade", parseInt(e.target.value) || 1)
                  }
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.preco}
                  onChange={(e) =>
                    atualizarItem(index, "preco", parseFloat(e.target.value) || 0)
                  }
                />
                <button className="botao-confirmar" onClick={() => setEditandoIndex(null)}>
                  ✅
                </button>
                <button onClick={() => excluirItem(index)}>❌</button>
              </>
            ) : (
              <>
                <span onClick={() => setEditandoIndex(index)}>
                  {item.nome} - {item.quantidade}x - R$ {item.preco?.toFixed(2)}
                </span>
                <button onClick={() => setEditandoIndex(index)}>✏️</button>
              </>
            )}
          </li>
        ))}
      </ul>

      <h3>Total da Compra: R$ {calcularTotal()}</h3>
    </div>
  );
};

export default ListaCompras;
