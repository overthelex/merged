import {
  renderLayout,
  heading,
  paragraph,
  button,
  muted,
  escapeHtml,
} from '../layout';

export type WelcomeInput = {
  name: string | null;
  brandUrl: string;
  logoUrl: string;
  portalUrl: string;
};

export function renderWelcome(input: WelcomeInput): { subject: string; html: string } {
  const greeting = input.name ? `Вітаємо, ${escapeHtml(input.name)}!` : 'Вітаємо у merged!';
  const body = [
    heading(greeting),
    paragraph(
      'Ваш акаунт HR-менеджера створено. Тепер ви можете створювати калібровані задачі на реальному репо компанії та надсилати посилання кандидатам.',
    ),
    paragraph(
      'Почати просто: вкажіть URL репозиторію, оберіть рівень позиції — ми підготуємо приватний форк і згенеруємо invite-посилання.',
    ),
    button('Відкрити портал', `${input.portalUrl}/`),
    muted(
      'Якщо ви не реєструвалися на merged — просто проігноруйте цей лист.',
    ),
  ].join('');

  return {
    subject: 'Вітаємо у merged',
    html: renderLayout({
      preview: 'Ваш акаунт merged створено — можете починати інтервʼю.',
      brandUrl: input.brandUrl,
      logoUrl: input.logoUrl,
      children: body,
    }),
  };
}
