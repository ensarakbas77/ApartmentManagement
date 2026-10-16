import { ChangePasswordScreen } from '@/components/change-password-screen';

/** İlk girişte zorunlu şifre belirleme ekranı (kök layout'ta mustChangePassword ile korunur). */
export default function SetPasswordScreen() {
  return <ChangePasswordScreen forced />;
}
