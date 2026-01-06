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

// 2. ADICIONAR ITEM
document.getElementById('add-item').addEventListener('click', () => {
    const novaLinha = document.createElement('div');
    novaLinha.className = 'item-linha';
    novaLinha.innerHTML = `
        <input type="text" placeholder="Produto" class="input-produto" autocomplete="off" inputmode="none">
        <input type="number" step="0.01" placeholder="R$ 0,00" class="input-preco" inputmode="none">
    `;
    document.getElementById('lista-compras').appendChild(novaLinha);
});

// 3. CÁLCULO E ORDENAÇÃO
function calcularTotal() {
    const precos = document.querySelectorAll('.input-preco');
    let total = 0;
    precos.forEach(input => total += (parseFloat(input.value) || 0));
    document.getElementById('valor-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function ordenarItens() {
    const lista = document.getElementById('lista-compras');
    const linhas = Array.from(document.querySelectorAll('.item-linha'));
    linhas.sort((a, b) => {
        const precoA = parseFloat(a.querySelector('.input-preco').value) || 0;
        const precoB = parseFloat(b.querySelector('.input-preco').value) || 0;
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
        e.preventDefault();
        if (!campoFocado) return;

        botao.classList.add('feedback-verde');
        setTimeout(() => botao.classList.remove('feedback-verde'), 100);

        if (botao.classList.contains('btn-apagar')) {
            campoFocado.value = campoFocado.value.slice(0, -1);
        } else if (botao.classList.contains('btn-espaco')) {
            campoFocado.value += " ";
        } else {
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
        const preco = parseFloat(linha.querySelector('.input-preco').value) || 0;
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

/* ===================================== */
/* FIX BOTÃO + (CAMPOS GÊMEOS)            */
/* RESOLVE VÍRGULA E PONTO               */
/* ===================================== */

(function () {

    // Se sua app já usa essa variável, não sobrescreve
    if (typeof window.campoFocado === 'undefined') {
        window.campoFocado = null;
    }

    function registrarCampo(input) {
        input.addEventListener('focus', () => {
            window.campoFocado = input;
        });

        input.addEventListener('click', () => {
            window.campoFocado = input;
        });
    }

    // Registra os campos já existentes
    document.querySelectorAll('.input-produto, .input-preco').forEach(registrarCampo);

    // Intercepta o botão +
    const btnAdd = document.getElementById('add-item') || document.querySelector('.btn-adicionar');
    if (!btnAdd) return;

    btnAdd.addEventListener('click', () => {

        // Aguarda o DOM criar o novo campo
        setTimeout(() => {
            const campos = document.querySelectorAll('.input-preco');
            const ultimoCampo = campos[campos.length - 1];

            if (!ultimoCampo) return;

            registrarCampo(ultimoCampo);

            // força foco correto
            ultimoCampo.focus();
            window.campoFocado = ultimoCampo;
        }, 0);

    });

})();
