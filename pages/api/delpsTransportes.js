"use strict";
import validateCPF from "../../utils/validateCPF";
import validateCNPJ from "../../utils/validateCNPJ";
import createTrackingMessage from "../../utils/createTrackingMessage";
import createTrackingMessageCNPJ from "../../utils/createTrackingMessageCNPJ";
import api from "../../services/sswAPI";

export default async (request, response) => {
  const { queryResult } = request.body;

  if (!queryResult) {
    return response.json({
      fulfillmentText: `🚫 Não chegou o queryResult no backend da aplicação.
      Se você está lendo esse erro, por favor mande um print para esse número:  wa.me/5562985295768`,
    });
  }

  const { intent } = queryResult;

  if (intent.displayName === "input.bem-vindo") {
    return response.json({
      fulfillmentText: `Olá! 👋\n\nEu sou a assistente virtual da *Delps* 👩‍💻\n\nEm razão da pandemia de COVID-19, manteremos nossas atividades de acordo com o cenário estadual. Entendemos que o transporte é vital para a manutenção da vida e manteremos nosso compromisso com nossos clientes e parceiros.\n\nDigite *menu* para ver o que eu já consigo fazer.`,
    });
  }

  if (intent.displayName === "menu-cidades-atendidas") {
    console.log("menu-cidades-atendidas");
    return response.json({
      fulfillmentMessages: [
        {
          card: {
            title: "Cidades atendidas",
            subtitle:
              "Você consegue visualizar todas as cidades que atendemos no link delps.net/cidades-atendidas",
            imageUri:
              "https://i0.wp.com/delps.net/wp-content/uploads/2019/01/Mapa-com-hachura.png",
          },
        },

        {
          text: {
            text: [
              `Você consegue visualizar todas as cidades que atendemos no link *delps.net/cidades-atendidas*`,
            ],
          },
        },
      ],
    });
  }

  if (intent.displayName === "rastreamento-cpf-destinatario") {
    const { cpf } = request.body.queryResult.parameters;

    if (!cpf) {
      return response.json({
        fulfillmentText: `🚫 Não chegou um CPF no backend da aplicação.
        _Se você está lendo esse erro, por favor mande um print para esse número:_  wa.me/5562985295768`,
      });
    }

    try {
      const isValidCPF = validateCPF(cpf);
      if (!isValidCPF) {
        return response.json({
          fulfillmentText: `🚫 O CPF ${cpf} é inválido, tente novamente com um CPF válido.
        Por favor, digite *rastrear* e depois digite *somente os 11 números*. Exemplo: 33606200110`,
        });
      }
    } catch (err) {
      return response.json({
        fulfillmentText: `🚫 ERRO 🚫 O CPF ${cpf} é inválido, tente novamente com um CPF válido.
        Por favor, digite *rastrear* e depois digite *somente os 11 números*. Exemplo: 33606200110`,
      });
    }

    try {
      console.log(
        `Entering carrier ${process.env.TRANSPORTADORA_DOMINIO} to track packages for CPF: ${cpf}`
      );
      const rastreamentoResponse = await api.post("/trackingpf", {
        dominio: "TNG",
        usuario: "arthur",
        senha: "1818",
        cpf,
      });

      if (rastreamentoResponse.data.success !== true) {
        return response.json({
          fulfillmentText: `🚫 Não encontrei no sistema encomendas para um destinatário com o CPF *${cpf}*`,
        });
      }

      const rastreamentoRawData = rastreamentoResponse.data.documentos;

      const rastreamentoData = rastreamentoRawData.map((data) => {
        const ocorrencias = data.tracking.map((track) => ({
          data_hora: track.data_hora,
          filial: track.filial,
          cidade: track.cidade,
          ocorrencia: track.ocorrencia,
          descricao: track.descricao,
        }));

        return {
          remetente: data.header.remetente,
          nro_nf: data.header.nro_nf,
          pedido: data.header.pedido,
          destinatario: data.header.destinatario,
          ocorrencias,
        };
      });

      // creates a message for the last item
      const mensagem = createTrackingMessage(
        rastreamentoData[rastreamentoData.length - 1]
      );

      console.log(`Successfuly returned the tracking data!`);
      return response.json({
        fulfillmentText: mensagem,
      });
    } catch (err) {
      console.error(err.message);
      return response.json({
        fulfillmentText: `🚫 Algo deu errado quando tentei consultar o sistema da transportadora. Por favor, tente novamente mais tarde. Você também pode rastrear no link delps.net/servicos-online`,
      });
    }
  }

  if (intent.displayName === "menu_de_rastreamento_escolheu_cnpj_pega_nf") {
    const { parameters } = queryResult;

    const { cnpj, nro_nf } = parameters;

    console.log(`CNPJ: ${cnpj}`, `NRO_NF: ${nro_nf}`);

    if (!cnpj) {
      return response.json({
        fulfillmentText: `🚫 Não chegou um CNPJ no backend da aplicação.
        _Se você está lendo esse erro, por favor mande um print para esse número:_  wa.me/5562985295768`,
      });
    }

    if (!nro_nf) {
      return response.json({
        fulfillmentText: `🚫 Não chegou um nro_nf no backend da aplicação.
        _Se você está lendo esse erro, por favor mande um print para esse número:_  wa.me/5562985295768`,
      });
    }
    console.log("Validating CNPJ...", cnpj.toString(), typeof cnpj.toString());

    const isCNPJValid = validateCNPJ(cnpj.toString());

    if (!isCNPJValid) {
      return response.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `🚫 O CNPJ ${cnpj} é inválido, tente novamente com um CNPJ válido.
              Por favor, digite *rastrear* e depois digite *somente os 14 números*. Exemplo: 01754239001272`,
              ],
            },
          },
        ],
      });
    }

    console.log("CNPJ is valid!");

    try {
      console.log(
        `Entering carrier TNG to track packages for CNPJ: ${cnpj} and for nro_nf: ${nro_nf}`
      );

      const rastreamentoResponse = await api.post("/tracking", {
        dominio: "TNG",
        usuario: "arthur",
        senha: "1818",
        cnpj,
        nro_nf,
      });

      if (rastreamentoResponse.data.success !== true) {
        return response.json({
          fulfillmentText: `🚫 Não encontrei no sistema encomendas para um remetente com o CNPJ ${cnpj} e NRO_NF: ${nro_nf}`,
        });
      }

      const { remetente, destinatario } = rastreamentoResponse.data.header;

      const ocorrencias = rastreamentoResponse.data.tracking;

      const trackingMessageFeedback = createTrackingMessageCNPJ({
        remetente,
        destinatario,
        ocorrencias,
      });

      return response.json({
        fulfillmentText: `${trackingMessageFeedback}`,
      });
    } catch (err) {
      console.error(err.message);
      return response.json({
        fulfillmentText: `🚫 Algo deu errado quando tentei consultar o sistema da transportadora. Por favor, tente novamente mais tarde. Você também pode rastrear no link delps.net/servicos-online`,
      });
    }
  }

  return response.json({
    fulfillmentText: `🚫 Não foi mapeado para nenhum dos intents. Se você está lendo esse erro, por favor mande um print para esse número: wa.me/5562985295768`,
  });
};
