import formatDate from "./formatDate";

export default function createTrackingMessageCNPJ({
  remetente,
  destinatario,
  ocorrencias,
}) {
  const messageHeader = `*📨Remetente:* \`\`\`${remetente}\`\`\` \n*🚚Destinatário:* \`\`\`${destinatario}\`\`\` \n\n*📰Ocorrências:*\n `;

  const ocorrenciasMessages = ocorrencias.map((ocorrencia) => {
    const messageOcorrencia = `*${
      ocorrencia.ocorrencia
    }*\n⌚Data/hora: ${formatDate(ocorrencia.data_hora)}\n📍Filial: ${
      ocorrencia.filial
    } - Cidade: ${ocorrencia.cidade}\n🗒Descrição: ${ocorrencia.descricao}`;

    return messageOcorrencia;
  });

  const ocorrenciasMessage = `${ocorrenciasMessages.join("\n\n")}`;

  return `${messageHeader} \n ${ocorrenciasMessage}`;
}
