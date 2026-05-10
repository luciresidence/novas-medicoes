import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const reportService = {
    // Generates the monthly report PDF with Water and Gas pages conditionally
    generateMonthlyPDF: (data: any[], apartments: any[], title: string) => {
        const doc = new jsPDF();

        // Helper to sort by unit number
        const sortByUnit = (a: any, b: any) => {
            const apA = apartments.find(ap => ap.id === a.apartment_id);
            const apB = apartments.find(ap => ap.id === b.apartment_id);
            if (!apA || !apB) return 0;

            const valA = apA.number || '';
            const valB = apB.number || '';
            const nA = parseInt(valA);
            const nB = parseInt(valB);
            const isNumA = !isNaN(nA);
            const isNumB = !isNaN(nB);

            // Unidades com texto (ex: COND. AB) sempre primeiro
            if (!isNumA && isNumB) return -1;
            if (isNumA && !isNumB) return 1;

            if (!isNumA && !isNumB) {
                return String(valA).localeCompare(String(valB));
            }

            // Unidades numéricas: ordenar por bloco (A antes de B)
            if (apA.block !== apB.block) {
                return (apA.block || '').localeCompare(apB.block || '');
            }

            // Mesmo bloco: ordenar por número
            return nA - nB;
        };

        const waterReadings = data.filter(r => r.type === 'water').sort(sortByUnit);
        const gasReadings = data.filter(r => r.type === 'gas').sort(sortByUnit);

        const hasWater = waterReadings.length > 0;
        const hasGas = gasReadings.length > 0;

        if (!hasWater && !hasGas) {
            alert('Não há dados para gerar o relatório.');
            return;
        }

        const headerText = `Condomínio Luci Berkembrock referente ao mês ${title}`;

        // --- GERAÇÃO ÁGUA ---
        if (hasWater) {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(headerText, 14, 20);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 102, 204); // Blue for Water
            doc.text(`Relatório de Consumo - Água`, 14, 32);

            const waterTableData = waterReadings.map(r => {
                const ap = apartments.find(a => a.id === r.apartment_id);
                const prev = Number(r.previous_value) || 0;
                const curr = Number(r.current_value) || 0;
                const consumption = curr - prev;

                return [
                    ap ? (isNaN(parseInt(ap.number)) ? ap.number : `${ap.number} ${ap.block}`) : '-',
                    ap?.residentName || '-',
                    prev.toFixed(2),
                    curr.toFixed(2),
                    consumption.toFixed(2)
                ];
            });

            autoTable(doc, {
                startY: 40,
                head: [['UNIDADE', 'MORADOR', 'ANTERIOR', 'ATUAL', 'CONSUMO']],
                body: waterTableData,
                theme: 'striped',
                headStyles: { fillColor: [0, 102, 204] },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    4: { fontStyle: 'bold', textColor: [0, 102, 204] }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 0) {
                        const text = data.cell.text[0];
                        if (text.endsWith(' B')) {
                            data.cell.styles.textColor = [6, 95, 70]; // Dark Green
                        } else if (text.endsWith(' A')) {
                            data.cell.styles.textColor = [128, 46, 83]; // Dark Red
                        }
                    }
                }
            });
        }

        // --- GERAÇÃO GÁS ---
        if (hasGas) {
            // Se já gerou água, adiciona nova página
            if (hasWater) {
                doc.addPage();
            }

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(headerText, 14, 20);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(204, 82, 0); // Orange for Gas
            doc.text(`Relatório de Consumo - Gás`, 14, 32);

            const gasTableData = gasReadings.map(r => {
                const ap = apartments.find(a => a.id === r.apartment_id);
                const prev = Number(r.previous_value) || 0;
                const curr = Number(r.current_value) || 0;
                const consumption = curr - prev;

                return [
                    ap ? (isNaN(parseInt(ap.number)) ? ap.number : `${ap.number} ${ap.block}`) : '-',
                    ap?.residentName || '-',
                    prev.toFixed(3),
                    curr.toFixed(3),
                    consumption.toFixed(3)
                ];
            });

            autoTable(doc, {
                startY: 40,
                head: [['UNIDADE', 'MORADOR', 'ANTERIOR', 'ATUAL', 'CONSUMO']],
                body: gasTableData,
                theme: 'striped',
                headStyles: { fillColor: [204, 82, 0] },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    4: { fontStyle: 'bold', textColor: [204, 82, 0] }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 0) {
                        const text = data.cell.text[0];
                        if (text.endsWith(' B')) {
                            data.cell.styles.textColor = [6, 95, 70]; // Dark Green
                        } else if (text.endsWith(' A')) {
                            data.cell.styles.textColor = [128, 46, 83]; // Dark Red
                        }
                    }
                }
            });
        }

        doc.save(`relatorio_mensal_${new Date().getTime()}.pdf`);
    },

    generateIndividualPDF: (apartment: any, readings: any[], startDate?: string, endDate?: string) => {
        const doc = new jsPDF();

        let subTitle = "";
        if (startDate && endDate) {
            subTitle = `referente ao período ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`;
        } else {
            const now = new Date();
            const month = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            subTitle = `referente ao mês ${month.charAt(0).toUpperCase() + month.slice(1)}`;
        }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`Condomínio Luci Berkembrock ${subTitle}`, 14, 20);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Relatório Individual - Apto ${apartment.number} ${apartment.block}`, 14, 32);
        doc.text(`Morador: ${apartment.residentName}`, 14, 38);

        const tableData = readings.map(r => {
            const prev = Number(r.previous_value) || 0;
            const curr = Number(r.current_value) || 0;
            const consumption = curr - prev;
            const precision = r.type === 'water' ? 2 : 3;

            return [
                new Date(r.date).toLocaleDateString('pt-BR'),
                r.type === 'water' ? 'Água' : 'Gás',
                prev.toFixed(precision),
                curr.toFixed(precision),
                consumption.toFixed(precision)
            ];
        });

        autoTable(doc, {
            startY: 45,
            head: [['DATA', 'TIPO', 'ANTERIOR', 'ATUAL', 'CONSUMO']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [128, 46, 83] },
            didParseCell: (data) => {
                // For individual reports, color the title or specific rows if needed
                // But mostly it's for the unit header which is already handled in text above
                // To be safe, we can color the header text row if it contains the unit info
            }
        });

        doc.save(`relatorio_apto_${apartment.number}.pdf`);
    }
};
