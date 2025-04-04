import React, { useState, useEffect } from "react";
import "./ListaCompras.css";

const ListaCompras = () => {
  const [horaAtual, setHoraAtual] = useState(new Date().toLocaleTimeString("pt-BR"));
  const [novoItem, setNovoItem] = useState({ nome: "", quantidade: 1, preco: 0 });
  const [itens, setItens] = useState([]);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [ultimaAlteracao, setUltimaAlteracao] = useState("");

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString("pt-BR"));
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const listaSalva = JSON.parse(localStorage.getItem("listaDeCompras")) || [];
    setItens(listaSalva);
  }, []);

  useEffect(() => {
    localStorage.setItem("listaDeCompras", JSON.stringify(itens));
    setUltimaAlteracao(new Date().toLocaleString("pt-BR"));
  }, [itens]);

  const adicionarItem = () => {
    if (!novoItem.nome.trim()) return;
    setItens([...itens, novoItem]);
    setNovoItem({ nome: "", quantidade: 1, preco: 0 });
  };

  const atualizarItem = (index, key, value) => {
    const novosItens = [...itens];
    novosItens[index][key] = value;
    setItens(novosItens);
  };

  const excluirItem = (index) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + item.quantidade * item.preco, 0).toFixed(2);
  };

  return (
    <div className="container">
      <h2>Lista de Compras 🛒</h2>
      <div className="relogio-digital">🕒 Hora Atual: {horaAtual}</div>
      {ultimaAlteracao && <p className="ultima-alteracao">Última alteração: {ultimaAlteracao}</p>}

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
          onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseInt(e.target.value) })}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Preço R$"
          value={novoItem.preco}
          onChange={(e) => setNovoItem({ ...novoItem, preco: parseFloat(e.target.value) || 0 })}
        />
        <button onClick={adicionarItem}>Adicionar</button>
      </div>

      <ul>
        {itens.map((item, index) => (
          <li key={index}>
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
                  onChange={(e) => atualizarItem(index, "quantidade", parseInt(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.preco}
                  onChange={(e) => atualizarItem(index, "preco", parseFloat(e.target.value) || 0)}
                />
                <button className="botao-confirmar" onClick={() => setEditandoIndex(null)}>✅ Confirmar</button>
                <button onClick={() => excluirItem(index)}>❌</button>
              </>
            ) : (
              <>
                <span onClick={() => setEditandoIndex(index)}>
                  {item.nome} - {item.quantidade}x - R$ {item.preco.toFixed(2)}
                </span>
                <button onClick={() => setEditandoIndex(index)}>✏️ Editar</button>
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
