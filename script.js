let campoFocado = null;

// 1. DATA E HORA
function atualizarDataHora() {
    const agora = new Date();
    const formatada = agora.toLocaleDateString('pt-BR') + ' às ' + 
                     agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let dataContainer = document.getElementById('data-registro');
    if (!dataContainer) {
        const topo = document.querySelector('.prancheta-topo');
        dataContainer = document.createElement('p');
        dataContainer.id = 'data-registro';
        dataContainer.style.cssText = 'text-align: center; font-weight: bold; margin-bottom: 10px; color: #555;';
        topo.appendChild(dataContainer);
    }
    dataContainer.innerText = formatada;
}

// 2. ADICIONAR ITEM (CORRIGIDO: CAMPOS GÊMEOS SEM BUG DE VÍRGULA)
document.getElementById('add-item').addEventListener('click', () => {
    const novaLinha = document.createElement('div');
    novaLinha.className = 'item-linha';
    novaLinha.innerHTML = `
        <input type="text" placeholder="Produto" class="input-produto" autocomplete="off" inputmode="none">
        <input type="text" placeholder="R$ 0,00" class="input-preco" autocomplete="off" inputmode="decimal">
    `;
    document.getElementById('lista-compras').appendChild(novaLinha);
    
    // Foca automaticamente no novo campo de preço criado
    const novoInputPreco = novaLinha.querySelector('.input-preco');
    novoInputPreco.focus();
    campoFocado = novoInputPreco;
});

// 3. CÁLCULO E ORDENAÇÃO (CORRIGIDO PARA ACEITAR VÍRGULA E PONTO)
function calcularTotal() {
    const precos = document.querySelectorAll('.input-preco');
    let total = 0;
    precos.forEach(input => {
        // Substitui vírgula por ponto para o cálculo matemático não quebrar
        const valorTratado = input.value.replace(',', '.');
        total += (parseFloat(valorTratado) || 0);
    });
    document.getElementById('valor-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function ordenarItens() {
    const lista = document.getElementById('lista-compras');
    const linhas = Array.from(document.querySelectorAll('.item-linha'));
    linhas.sort((a, b) => {
        const precoA = parseFloat(a.querySelector('.input-preco').value.replace(',', '.')) || 0;
        const precoB = parseFloat(b.querySelector('.input-preco').value.replace(',', '.')) || 0;
        return precoA - precoB;
    });
    linhas.forEach(linha => lista.appendChild(linha));
}

// 4. LÓGICA DO TECLADO E VISOR
function atualizarVisor() {
    const visor = document.getElementById('teclado-visor');
    if (campoFocado) {
        visor.innerText = campoFocado.value || "Digitando...";
    }
}

function mostrarPainel(tipo) {
    document.getElementById('painel-letras').style.display = (tipo === 'letras') ? 'grid' : 'none';
    document.getElementById('painel-numeros').style.display = (tipo === 'numeros') ? 'grid' : 'none';
}

document.addEventListener('focusin', (e) => {
    if (e.target.classList.contains('input-produto') || e.target.classList.contains('input-preco')) {
        campoFocado = e.target;
        document.getElementById('teclado-custom').classList.add('ativo');
        mostrarPainel(e.target.classList.contains('input-preco') ? 'numeros' : 'letras');
        atualizarVisor();
    }
});

document.querySelectorAll('.key').forEach(botao => {
    botao.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Importante: evita que o input perca o foco ao clicar na tecla
        if (!campoFocado) return;

        botao.classList.add('feedback-verde');
        setTimeout(() => botao.classList.remove('feedback-verde'), 100);

        if (botao.classList.contains('btn-apagar')) {
            campoFocado.value = campoFocado.value.slice(0, -1);
        } else if (botao.classList.contains('btn-espaco')) {
            campoFocado.value += " ";
        } else {
            // Aceita o caractere da tecla (seja número, letra, ponto ou vírgula)
            campoFocado.value += botao.innerText;
        }

        atualizarVisor();
        calcularTotal();
    });
});

document.getElementById('btn-alternar').addEventListener('click', (e) => {
    e.preventDefault();
    const letras = document.getElementById('painel-letras').style.display !== 'none';
    mostrarPainel(letras ? 'numeros' : 'letras');
});

document.getElementById('fechar-teclado').addEventListener('click', () => {
    document.getElementById('teclado-custom').classList.remove('ativo');
    if (campoFocado) campoFocado.blur();
    campoFocado = null;
});

// 5. IMPRESSÃO E WHATSAPP
document.getElementById('btn-imprimir').addEventListener('click', () => {
    ordenarItens();
    setTimeout(() => { window.print(); }, 250);
});

document.getElementById('btn-enviar').addEventListener('click', () => {
    const numeroInput = document.getElementById('whatsapp-numero').value;
    const numeroLimpo = numeroInput.replace(/\D/g, '');

    if (numeroLimpo.length < 10) {
        alert("Insira um número de WhatsApp válido.");
        return;
    }

    ordenarItens();
    let msg = `*NUCLEUS DISPENSER*\nData: ${document.getElementById('data-registro').innerText}\n\n`;
    
    document.querySelectorAll('.item-linha').forEach((linha, i) => {
        const prod = linha.querySelector('.input-produto').value || "Item";
        const precoRaw = linha.querySelector('.input-preco').value.replace(',', '.') || 0;
        const preco = parseFloat(precoRaw) || 0;
        if (preco > 0 || prod !== "Item") {
            msg += `${i+1}. *${prod}*: R$ ${preco.toFixed(2).replace('.', ',')}\n`;
        }
    });

    msg += `\n*TOTAL: ${document.getElementById('valor-total').innerText}*`;
    window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
});

// INICIALIZAÇÃO
atualizarDataHora();
setInterval(atualizarDataHora, 60000);


/* === TRAVA DE TECLADO NATIVO PARA NOVOS E ANTIGOS ITENS === */
const travarTeclado = () => {
    document.querySelectorAll('.input-produto, .input-preco').forEach(input => {
        input.setAttribute('inputmode', 'none'); // Bloqueia teclado nativo
        // Garante que o clique não "acorde" o sistema operacional
        input.onclick = () => input.focus(); 
    });
};

// VIGIA A LISTA: Toda vez que um item novo entrar, ele trava o teclado nativo
const vigiaLista = new MutationObserver(() => travarTeclado());
vigiaLista.observe(document.getElementById('lista-compras'), { childList: true });

// Executa a primeira vez para os campos que já estão na tela
travarTeclado();