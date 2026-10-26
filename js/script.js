// ============================================================
// COPA CHALLENGE — SISTEMA PRINCIPAL
// ============================================================

// ------------------------------------------------------------
// ESTADO
// ------------------------------------------------------------

let campeonato = {
    nome: "",
    data: "",
    quantidadeTimes: 0,
    quantidadeJogadores: 0,
    times: [],
    rodadas: []
};

let jogadoresAtuais = [];
let escudoAtual = "";
let indiceEdicao = null;

let partidaAtual = null;
let cronometroInterval = null;
let segundosPartida = 0;

let ladoGolAtual = null;
let jogadorSelecionado = null;


// ------------------------------------------------------------
// ELEMENTOS
// ------------------------------------------------------------

const telaInicial = document.getElementById("telaInicial");
const telaConfiguracao = document.getElementById("telaConfiguracao");
const telaTime = document.getElementById("telaTime");
const telaTimes = document.getElementById("telaTimes");
const telaChaves = document.getElementById("telaChaves");
const listaJogadores = document.getElementById("listaJogadores");
const modalPartida = document.getElementById("modalPartida");
const modalGol = document.getElementById("modalGol");


// ------------------------------------------------------------
// TROCA DE TELA
// ------------------------------------------------------------

function mostrarTela(tela) {
    [telaInicial, telaConfiguracao, telaTime, telaTimes, telaChaves]
        .forEach(t => t.classList.add("tela-escondida"));

    tela.classList.remove("tela-escondida");
}


// ------------------------------------------------------------
// NOVO CAMPEONATO
// ------------------------------------------------------------

document.getElementById("btnNovoCampeonato").addEventListener("click", () => {
    campeonato = {
        nome: "", data: "",
        quantidadeTimes: 0, quantidadeJogadores: 0,
        times: [], rodadas: []
    };
    jogadoresAtuais = [];
    escudoAtual = "";
    indiceEdicao = null;

    limparFormularioTime();
    mostrarTela(telaConfiguracao);
});


// ------------------------------------------------------------
// CONTINUAR CAMPEONATO
// ------------------------------------------------------------

document.getElementById("btnContinuar").addEventListener("click", continuarCampeonato);

function continuarCampeonato() {
    const dados = localStorage.getItem("copaChallenge");

    if (!dados) {
        alert("Nenhum campeonato salvo foi encontrado. ⚠️");
        return;
    }

    try {
        campeonato = JSON.parse(dados);
    } catch {
        alert("Não foi possível carregar o campeonato salvo.");
        return;
    }

    if (!campeonato || !campeonato.nome) {
        alert("O campeonato salvo está inválido.");
        return;
    }

    if (campeonato.rodadas && campeonato.rodadas.length > 0) {
        gerarChaves(false);
        mostrarTela(telaChaves);
        return;
    }

    if (campeonato.times.length >= campeonato.quantidadeTimes) {
        mostrarTimes();
        mostrarTela(telaTimes);
        return;
    }

    jogadoresAtuais = [];
    escudoAtual = "";
    indiceEdicao = null;
    limparFormularioTime();
    atualizarContadorTime();
    mostrarTela(telaTime);
}


// ------------------------------------------------------------
// CRIAR CAMPEONATO
// ------------------------------------------------------------

document.getElementById("btnVoltar").addEventListener("click", () => {
    mostrarTela(telaInicial);
});

document.getElementById("btnCriarCampeonato").addEventListener("click", () => {
    const nome = document.getElementById("nomeCampeonato").value.trim();
    const data = document.getElementById("dataCampeonato").value;
    const quantidadeTimes = Number(document.getElementById("quantidadeTimes").value);
    const quantidadeJogadores = Number(document.getElementById("quantidadeJogadores").value);

    if (nome === "") { alert("Digite o nome do campeonato!"); return; }
    if (data === "") { alert("Escolha a data do campeonato!"); return; }

    campeonato = {
        nome, data, quantidadeTimes, quantidadeJogadores,
        times: [], rodadas: []
    };

    jogadoresAtuais = [];
    escudoAtual = "";
    indiceEdicao = null;

    salvarCampeonato();
    limparFormularioTime();
    atualizarContadorTime();
    mostrarTela(telaTime);
});


// ------------------------------------------------------------
// ADICIONAR JOGADOR
// ------------------------------------------------------------

document.getElementById("btnAdicionarJogador").addEventListener("click", adicionarJogador);

function adicionarJogador() {
    const nome = document.getElementById("nomeJogador").value.trim();
    const numero = Number(document.getElementById("numeroJogador").value);
    const posicao = document.getElementById("posicaoJogador").value;
    const capitao = document.getElementById("jogadorCapitao").checked;

    if (nome === "") { alert("Digite o nome do jogador!"); return; }

    if (isNaN(numero) || numero < 1 || numero > 99) {
        alert("Digite um número entre 1 e 99!");
        return;
    }

    if (jogadoresAtuais.some(j => j.numero === numero)) {
        alert("Esse número já está sendo usado!");
        return;
    }

    if (capitao) {
        jogadoresAtuais.forEach(j => j.capitao = false);
    }

    jogadoresAtuais.push({
        id: Date.now() + Math.random(),
        nome, numero, posicao, capitao,
        gols: 0
    });

    document.getElementById("nomeJogador").value = "";
    document.getElementById("numeroJogador").value = "";
    document.getElementById("jogadorCapitao").checked = false;

    atualizarListaJogadores();
}


// ------------------------------------------------------------
// LISTA DE JOGADORES
// ------------------------------------------------------------

function atualizarListaJogadores() {
    if (jogadoresAtuais.length === 0) {
        listaJogadores.innerHTML = `
            <div class="lista-vazia">
                <span>👥</span>
                <p>Nenhum jogador cadastrado.</p>
            </div>
        `;
        return;
    }

    listaJogadores.innerHTML = "";

    jogadoresAtuais.forEach((jogador, indice) => {
        const card = document.createElement("div");
        card.className = "jogador-card";

        card.innerHTML = `
            <div class="jogador-info">
                <div class="jogador-numero">${jogador.numero}</div>
                <div class="jogador-dados">
                    <strong>${jogador.nome}</strong>
                    <span>${jogador.posicao}</span>
                </div>
                ${jogador.capitao ? `<span class="jogador-capitao">👑 Capitão</span>` : ""}
            </div>
            <button type="button" class="btn-remover-jogador" data-indice="${indice}">
                🗑️
            </button>
        `;

        card.querySelector(".btn-remover-jogador")
            .addEventListener("click", () => removerJogador(indice));

        listaJogadores.appendChild(card);
    });
}


// ------------------------------------------------------------
// REMOVER JOGADOR
// ------------------------------------------------------------

function removerJogador(indice) {
    jogadoresAtuais.splice(indice, 1);
    atualizarListaJogadores();
}


// ------------------------------------------------------------
// ESCUDO
// ------------------------------------------------------------

document.getElementById("escudoTime").addEventListener("change", function () {
    const arquivo = this.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = function (evento) {
        escudoAtual = evento.target.result;
        document.getElementById("escudoPreview").innerHTML =
            `<img src="${escudoAtual}" alt="Escudo do time">`;
    };

    leitor.readAsDataURL(arquivo);
});


// ------------------------------------------------------------
// SALVAR TIME
// ------------------------------------------------------------

document.getElementById("btnSalvarTime").addEventListener("click", salvarTime);

function salvarTime() {
    const nome = document.getElementById("nomeTime").value.trim();
    const cor = document.getElementById("corTime").value;

    if (nome === "") { alert("Digite o nome do time!"); return; }
    if (jogadoresAtuais.length === 0) { alert("Cadastre pelo menos um jogador!"); return; }

    if (jogadoresAtuais.length > campeonato.quantidadeJogadores) {
        alert(`Esse campeonato permite no máximo ${campeonato.quantidadeJogadores} jogadores por time.`);
        return;
    }

    const time = {
        id: Date.now() + Math.random(),
        nome, cor,
        escudo: escudoAtual,
        jogadores: [...jogadoresAtuais],
        vitorias: 0, derrotas: 0, empates: 0,
        golsMarcados: 0, golsSofridos: 0
    };

    if (indiceEdicao !== null) {
        campeonato.times[indiceEdicao] = time;
        indiceEdicao = null;
        salvarCampeonato();
        alert(`${nome} atualizado!`);
        mostrarTimes();
        mostrarTela(telaTimes);
        return;
    }

    campeonato.times.push(time);
    salvarCampeonato();

    if (campeonato.times.length >= campeonato.quantidadeTimes) {
        alert("Todos os times foram cadastrados! ⚽🏆");
        mostrarTimes();
        mostrarTela(telaTimes);
        return;
    }

    alert(`${nome} cadastrado com sucesso!`);

    jogadoresAtuais = [];
    escudoAtual = "";
    limparFormularioTime();
    atualizarContadorTime();
}


// ------------------------------------------------------------
// PERSISTÊNCIA
// ------------------------------------------------------------

function salvarCampeonato() {
    localStorage.setItem("copaChallenge", JSON.stringify(campeonato));
}


// ------------------------------------------------------------
// CONTADOR
// ------------------------------------------------------------

function atualizarContadorTime() {
    const numero = campeonato.times.length + 1;
    document.getElementById("contadorTime").textContent =
        `Time ${numero} de ${campeonato.quantidadeTimes}`;
}


// ------------------------------------------------------------
// LIMPAR FORMULÁRIO
// ------------------------------------------------------------

function limparFormularioTime() {
    document.getElementById("nomeTime").value = "";
    document.getElementById("corTime").value = "#16a34a";
    document.getElementById("escudoTime").value = "";
    document.getElementById("nomeJogador").value = "";
    document.getElementById("numeroJogador").value = "";
    document.getElementById("jogadorCapitao").checked = false;
    document.getElementById("escudoPreview").innerHTML = "🛡️";
    atualizarListaJogadores();
}


// ------------------------------------------------------------
// VOLTAR DA TELA DO TIME
// ------------------------------------------------------------

document.getElementById("btnVoltarTime").addEventListener("click", () => {
    if (indiceEdicao !== null) {
        indiceEdicao = null;
        jogadoresAtuais = [];
        escudoAtual = "";
        limparFormularioTime();
        mostrarTimes();
        mostrarTela(telaTimes);
        return;
    }
    mostrarTela(telaConfiguracao);
});


// ------------------------------------------------------------
// MOSTRAR TIMES
// ------------------------------------------------------------

function mostrarTimes() {
    const lista = document.getElementById("listaTimes");
    lista.innerHTML = "";

    document.getElementById("resumoCampeonato").textContent =
        `${campeonato.nome} • ${campeonato.times.length} times cadastrados`;

    campeonato.times.forEach((time, indice) => {
        const card = document.createElement("div");
        card.className = "time-card";
        card.style.setProperty("--cor-time", time.cor);

        const capitao = time.jogadores.find(j => j.capitao);

        let jogadoresHTML = "";
        time.jogadores.forEach(j => {
            jogadoresHTML += `
                <div class="jogador-time-item">
                    <span class="numero-mini">${j.numero}</span>
                    <span>${j.nome}</span>
                    <span class="posicao-mini">${j.posicao}</span>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="time-card-header">
                <div class="escudo-time-card">
                    ${time.escudo ? `<img src="${time.escudo}" alt="Escudo">` : "🛡️"}
                </div>
                <div>
                    <div class="nome-time-card">${time.nome}</div>
                    <div class="quantidade-jogadores">👥 ${time.jogadores.length} jogadores</div>
                </div>
            </div>

            ${capitao ? `<div class="capitao-time">👑 Capitão: ${capitao.nome}</div>` : ""}

            <div class="jogadores-time">${jogadoresHTML}</div>

            <button class="btn-editar-time" data-indice="${indice}">✏️ Editar Time</button>
        `;

        card.querySelector(".btn-editar-time")
            .addEventListener("click", () => editarTime(indice));

        lista.appendChild(card);
    });
}


// ------------------------------------------------------------
// EDITAR TIME
// ------------------------------------------------------------

function editarTime(indice) {
    const time = campeonato.times[indice];
    if (!time) return;

    indiceEdicao = indice;

    document.getElementById("nomeTime").value = time.nome;
    document.getElementById("corTime").value = time.cor;

    jogadoresAtuais = time.jogadores.map(j => ({ ...j }));
    escudoAtual = time.escudo || "";

    document.getElementById("escudoPreview").innerHTML = escudoAtual
        ? `<img src="${escudoAtual}" alt="Escudo do time">`
        : "🛡️";

    atualizarListaJogadores();
    document.getElementById("contadorTime").textContent = `Editando: ${time.nome}`;
    mostrarTela(telaTime);
}


// ------------------------------------------------------------
// VOLTAR DA CONFERÊNCIA
// ------------------------------------------------------------

document.getElementById("btnVoltarTimes").addEventListener("click", () => {
    mostrarTela(telaInicial);
});


// ------------------------------------------------------------
// INICIAR CAMPEONATO
// ------------------------------------------------------------

document.getElementById("btnIniciarCampeonato").addEventListener("click", () => {
    if (campeonato.times.length !== campeonato.quantidadeTimes) {
        alert("Ainda faltam times para iniciar o campeonato! ⚠️");
        return;
    }

    gerarChaves(true);
    salvarCampeonato();
    mostrarTela(telaChaves);
});


// ------------------------------------------------------------
// GERAR CHAVES
// ------------------------------------------------------------

function gerarChaves(novoSorteio = true) {
    document.getElementById("nomeCampeonatoChaves").textContent = campeonato.nome;
    document.getElementById("quantidadeTimesChaves").textContent = campeonato.times.length;
    document.getElementById("formatoCampeonato").textContent =
        campeonato.quantidadeTimes === 2 ? "Final" : "Eliminatórias";

    if (novoSorteio || !campeonato.rodadas || campeonato.rodadas.length === 0) {
        criarEstruturaCampeonato();
    }

    renderizarChaves();
}


// ------------------------------------------------------------
// ESTRUTURA DO CAMPEONATO
// ------------------------------------------------------------

function criarEstruturaCampeonato() {
    const times = [...campeonato.times].sort(() => Math.random() - 0.5);
    const rodadas = criarRodadas(times.length);

    let contador = 0;
    rodadas[0].partidas.forEach(partida => {
        partida.time1 = times[contador++] || null;
        partida.time2 = times[contador++] || null;
    });

    campeonato.rodadas = rodadas;
    salvarCampeonato();
}


// ------------------------------------------------------------
// CRIAR RODADAS
// ------------------------------------------------------------

function criarRodadas(quantidadeTimes) {
    const nomesRodadas = {
        2: ["FINAL"],
        4: ["SEMIFINAL", "FINAL"],
        8: ["QUARTAS DE FINAL", "SEMIFINAL", "FINAL"],
        16: ["OITAVAS DE FINAL", "QUARTAS DE FINAL", "SEMIFINAL", "FINAL"],
        32: ["16-AVOS DE FINAL", "OITAVAS DE FINAL", "QUARTAS DE FINAL", "SEMIFINAL", "FINAL"]
    };

    const nomes = nomesRodadas[quantidadeTimes];
    const rodadas = [];

    nomes.forEach((nome, indice) => {
        const quantidadePartidas = quantidadeTimes / Math.pow(2, indice + 1);
        const partidas = [];

        for (let i = 0; i < quantidadePartidas; i++) {
            partidas.push({
                time1: null, time2: null,
                gols1: 0, gols2: 0,
                finalizada: false,
                vencedor: null,
                historicoGols: []
            });
        }

        rodadas.push({ nome, partidas });
    });

    return rodadas;
}


// ------------------------------------------------------------
// RENDERIZAR CHAVES
// ------------------------------------------------------------

function renderizarChaves() {
    const bracket = document.getElementById("bracket");
    bracket.innerHTML = "";

    campeonato.rodadas.forEach((rodada, indiceRodada) => {
        const coluna = document.createElement("div");
        coluna.className = "bracket-coluna";

        const titulo = document.createElement("h3");
        titulo.textContent = rodada.nome;
        coluna.appendChild(titulo);

        rodada.partidas.forEach((partida, indicePartida) => {
            const jogo = document.createElement("div");
            jogo.className = "partida-card";
            jogo.innerHTML = criarPartidaHTML(partida, indiceRodada, indicePartida);
            coluna.appendChild(jogo);
        });

        bracket.appendChild(coluna);
    });

    // Listener global pros botões "Iniciar Partida"
    bracket.querySelectorAll(".btn-partida").forEach(btn => {
        btn.addEventListener("click", function () {
            const r = Number(this.dataset.rodada);
            const p = Number(this.dataset.partida);
            abrirPartida(r, p);
        });
    });
}


// ------------------------------------------------------------
// HTML DA PARTIDA
// ------------------------------------------------------------

function criarPartidaHTML(partida, indiceRodada, indicePartida) {
    const t1 = partida.time1;
    const t2 = partida.time2;

    const nome1 = t1 ? t1.nome : "A definir";
    const nome2 = t2 ? t2.nome : "A definir";

    const escudo1 = t1 && t1.escudo ? `<img src="${t1.escudo}" alt="Escudo">` : "⚽";
    const escudo2 = t2 && t2.escudo ? `<img src="${t2.escudo}" alt="Escudo">` : "⚽";

    const podeIniciar = t1 && t2 && !partida.finalizada;

    const venc1 = partida.finalizada && partida.vencedor === t1;
    const venc2 = partida.finalizada && partida.vencedor === t2;

    return `
        <div class="time-chave ${venc1 ? "vencedor" : ""}">
            <div class="escudo-chave">${escudo1}</div>
            <span>${nome1}</span>
            <strong>${partida.gols1}</strong>
        </div>

        <div class="linha-partida"></div>

        <div class="time-chave ${venc2 ? "vencedor" : ""}">
            <div class="escudo-chave">${escudo2}</div>
            <span>${nome2}</span>
            <strong>${partida.gols2}</strong>
        </div>

        ${podeIniciar
            ? `<button class="btn-partida" data-rodada="${indiceRodada}" data-partida="${indicePartida}">⚽ INICIAR PARTIDA</button>`
            : partida.finalizada
                ? `<div class="partida-finalizada">🏁 Partida encerrada</div>`
                : `<div class="partida-finalizada">⏳ Aguardando vencedor</div>`
        }
    `;
}


// ============================================================
// PAINEL DE PARTIDA
// ============================================================

function abrirPartida(indiceRodada, indicePartida) {
    const rodada = campeonato.rodadas[indiceRodada];
    const partida = rodada.partidas[indicePartida];

    if (!partida || !partida.time1 || !partida.time2) {
        alert("Essa partida ainda não possui os dois times definidos.");
        return;
    }

    partidaAtual = { indiceRodada, indicePartida, partida };
    segundosPartida = 0;

    atualizarModalPartida();
    iniciarCronometro();
    modalPartida.classList.remove("tela-escondida");
}


function atualizarModalPartida() {
    if (!partidaAtual) return;
    const p = partidaAtual.partida;

    const setTexto = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    };

    const setHTML = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = valor;
    };

    setTexto("nomeModal1", p.time1.nome);
    setTexto("nomeModal2", p.time2.nome);
    setTexto("golsModal1", p.gols1);
    setTexto("golsModal2", p.gols2);

    setHTML("escudoModal1", p.time1.escudo ? `<img src="${p.time1.escudo}" alt="">` : "⚽");
    setHTML("escudoModal2", p.time2.escudo ? `<img src="${p.time2.escudo}" alt="">` : "⚽");

    const hist = document.getElementById("historicoGols");
    if (hist) {
        if (!p.historicoGols || p.historicoGols.length === 0) {
            hist.innerHTML = `<div class="historico-vazio">Nenhum gol ainda.</div>`;
        } else {
            hist.innerHTML = p.historicoGols
                .map(g => `<div class="gol-item">⚽ ${g.jogador} (${g.time}) — ${g.minuto}'</div>`)
                .join("");
        }
    }

    // Habilita/desabilita o botão Encerrar
    const btnEncerrar = document.getElementById("btnEncerrarPartida");
    if (btnEncerrar) {
        if (p.gols1 === p.gols2) {
            btnEncerrar.disabled = true;
            btnEncerrar.textContent = "⚠️ Empate — marque um gol";
            btnEncerrar.classList.add("btn-desabilitado");
        } else {
            btnEncerrar.disabled = false;
            btnEncerrar.textContent = "🏁 Encerrar Partida";
            btnEncerrar.classList.remove("btn-desabilitado");
        }
    }
}


// ------------------------------------------------------------
// CRONÔMETRO
// ------------------------------------------------------------

function iniciarCronometro() {
    clearInterval(cronometroInterval);
    atualizarCronometro();

    cronometroInterval = setInterval(() => {
        segundosPartida++;
        atualizarCronometro();
    }, 1000);
}

function atualizarCronometro() {
    const min = String(Math.floor(segundosPartida / 60)).padStart(2, "0");
    const seg = String(segundosPartida % 60).padStart(2, "0");
    document.getElementById("cronometro").textContent = `${min}:${seg}`;
}


// ------------------------------------------------------------
// REGISTRAR GOL (com modal personalizado)
// ------------------------------------------------------------

function registrarGol(lado) {
    if (!partidaAtual) return;

    const p = partidaAtual.partida;
    const time = lado === 1 ? p.time1 : p.time2;

    ladoGolAtual = lado;
    jogadorSelecionado = null;

    document.getElementById("modalGolTime").textContent = `Time: ${time.nome}`;
    document.getElementById("inputGolJogador").value = "";

    const container = document.getElementById("modalGolJogadores");
    container.innerHTML = "";

    time.jogadores.forEach(jogador => {
        const chip = document.createElement("div");
        chip.className = "jogador-opcao";
        chip.textContent = `${jogador.numero} - ${jogador.nome}`;
        chip.addEventListener("click", () => selecionarJogadorGol(jogador.nome, chip));
        container.appendChild(chip);
    });

    modalGol.classList.remove("tela-escondida");

    setTimeout(() => document.getElementById("inputGolJogador").focus(), 100);
}


function selecionarJogadorGol(nome, chip) {
    jogadorSelecionado = nome;
    document.getElementById("inputGolJogador").value = nome;

    document.querySelectorAll(".jogador-opcao").forEach(c => c.classList.remove("selecionado"));
    chip.classList.add("selecionado");
}


function confirmarGol() {
    if (!partidaAtual || ladoGolAtual === null) return;

    const p = partidaAtual.partida;
    const time = ladoGolAtual === 1 ? p.time1 : p.time2;

    const nomeDigitado = document.getElementById("inputGolJogador").value.trim();

    if (nomeDigitado === "") {
        alert("Digite ou selecione o jogador que marcou o gol!");
        return;
    }

    const jogador = time.jogadores.find(
        j => j.nome.toLowerCase() === nomeDigitado.toLowerCase()
    );

    if (!jogador) {
        alert("Jogador não encontrado nesse time.");
        return;
    }

    jogador.gols = (jogador.gols || 0) + 1;

    if (ladoGolAtual === 1) p.gols1++;
    else p.gols2++;

    const minuto = Math.floor(segundosPartida / 60) + 1;

    if (!p.historicoGols) p.historicoGols = [];
    p.historicoGols.push({
        jogador: jogador.nome,
        time: time.nome,
        minuto
    });

    salvarCampeonato();
    fecharModalGol();
    atualizarModalPartida();
}


function fecharModalGol() {
    modalGol.classList.add("tela-escondida");
    ladoGolAtual = null;
    jogadorSelecionado = null;
}


// ------------------------------------------------------------
// ENCERRAR PARTIDA
// ------------------------------------------------------------

function encerrarPartida() {
    if (!partidaAtual) return;
    const { indiceRodada, indicePartida, partida } = partidaAtual;

    // Se tiver empatado, só não faz nada (o botão fica desabilitado mesmo)
    if (partida.gols1 === partida.gols2) {
        return;
    }

    const vencedor = partida.gols1 > partida.gols2 ? partida.time1 : partida.time2;
    const perdedor = vencedor === partida.time1 ? partida.time2 : partida.time1;

    partida.finalizada = true;
    partida.vencedor = vencedor;

    vencedor.vitorias = (vencedor.vitorias || 0) + 1;
    perdedor.derrotas = (perdedor.derrotas || 0) + 1;
    vencedor.golsMarcados = (vencedor.golsMarcados || 0) + Math.max(partida.gols1, partida.gols2);
    vencedor.golsSofridos = (vencedor.golsSofridos || 0) + Math.min(partida.gols1, partida.gols2);
    perdedor.golsMarcados = (perdedor.golsMarcados || 0) + Math.min(partida.gols1, partida.gols2);
    perdedor.golsSofridos = (perdedor.golsSofridos || 0) + Math.max(partida.gols1, partida.gols2);

    const proximaRodada = campeonato.rodadas[indiceRodada + 1];
    if (proximaRodada) {
        const proximaPartida = proximaRodada.partidas[Math.floor(indicePartida / 2)];
        if (indicePartida % 2 === 0) proximaPartida.time1 = vencedor;
        else proximaPartida.time2 = vencedor;
    } else {
        // Era a final → mostra o modal de campeão
        setTimeout(() => mostrarCampeao(vencedor), 300);
    }

    salvarCampeonato();
    fecharModalPartida();
    renderizarChaves();
}

// ------------------------------------------------------------
// FECHAR MODAL DE PARTIDA
// ------------------------------------------------------------

function fecharModalPartida() {
    clearInterval(cronometroInterval);
    cronometroInterval = null;
    partidaAtual = null;
    modalPartida.classList.add("tela-escondida");
}


// ------------------------------------------------------------
// VOLTAR DAS CHAVES
// ------------------------------------------------------------

document.getElementById("btnVoltarChaves").addEventListener("click", () => {
    mostrarTimes();
    mostrarTela(telaTimes);
});


// ------------------------------------------------------------
// ENTER CONFIRMA GOL
// ------------------------------------------------------------

document.getElementById("inputGolJogador").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        confirmarGol();
    }
});


// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------

atualizarListaJogadores();