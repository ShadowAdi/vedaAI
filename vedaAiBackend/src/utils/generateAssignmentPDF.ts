import PDFDocument from 'pdfkit';
import { IAssignment, IQuestion, ISection } from '../interface/assignment.interface.js';

export const generateAssignmentPDF = async (assignment: IAssignment): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
            });

            let buffers: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            doc.fontSize(24).font('Helvetica-Bold').text(assignment.title, { align: 'center' });
            doc.moveDown(0.5);

            doc.fontSize(11).font('Helvetica');
            doc.text(`Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}`, { align: 'left' });
            doc.text(`Total Marks: ${assignment.totalMarks}`, { align: 'left' });
            if (assignment.additionalInstructions) {
                doc.moveDown(0.3);
                doc.fontSize(10).font('Helvetica-Oblique').text(`Instructions: ${assignment.additionalInstructions}`);
            }

            doc.moveDown(1);
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.5);

            if (assignment.generatedQuestions && assignment.generatedQuestions.sections && assignment.generatedQuestions.sections.length > 0) {
                const sections = assignment.generatedQuestions.sections;

                const groupedSections = groupQuestionsBySection(sections);

                groupedSections.forEach((section: any) => {
                    doc.fontSize(14).font('Helvetica-Bold').text(`${section.title}`, {
                        underline: true,
                    });
                    doc.moveDown(0.3);

                    if (section.instruction) {
                        doc.fontSize(9).font('Helvetica-Oblique').text(`${section.instruction}`);
                        doc.moveDown(0.2);
                    }

                    section.questions.forEach((question: IQuestion, qIdx: number) => {
                        const questionNumber = `${qIdx + 1}`;

                        doc.fontSize(11).font('Helvetica');
                        doc.text(`${questionNumber}. ${question.text}`, {
                            align: 'left',
                            continued: false,
                        });

                        const difficultyColor = getDifficultyColor(question.difficulty);
                        doc.fontSize(9).font('Helvetica');
                        doc.fillColor(difficultyColor)
                            .text(`[${question.difficulty}]`, {
                                continued: true,
                                align: 'left',
                            });
                        doc.fillColor('#000000').text(` | Marks: ${question.marks}`, {
                            align: 'left',
                        });

                        doc.moveDown(0.5);

                        if (doc.y > 700) {
                            doc.addPage();
                            doc.moveDown(0.5);
                        }
                    });

                    doc.moveDown(1);
                });
            } else {
                doc.fontSize(11).fillColor('#666').text('No questions generated yet.', { align: 'center' }).fillColor('#000000');
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const groupQuestionsBySection = (sections: ISection[]): ISection[] => {
    return sections;
};

const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
        case 'easy':
            return '#00A86B';
        case 'medium':
        case 'moderate':
            return '#FFA500';
        case 'hard':
        case 'difficult':
            return '#DC143C';
        default:
            return '#000000';
    }
};
