        function calcularPreco() {
            const malha = parseFloat(document.getElementById('calc-malha').value) || 0;
            const dtf = parseFloat(document.getElementById('calc-dtf').value) || 0;
            const etiq = parseFloat(document.getElementById('calc-etiq').value) || 0;
            const mao = parseFloat(document.getElementById('calc-mao').value) || 0;

            const custoTotal = malha + dtf + etiq + mao;
            const precoSugerido = custoTotal * 2.35;
            const lucroEst = precoSugerido * 0.84 - custoTotal;

            document.getElementById('res-custo-total').innerText = 'R$ ' + custoTotal.toFixed(2);
            document.getElementById('res-preco-sugerido').innerText = 'R$ ' + precoSugerido.toFixed(2);
            document.getElementById('res-lucro-est').innerText = 'R$ ' + lucroEst.toFixed(2);
        }

