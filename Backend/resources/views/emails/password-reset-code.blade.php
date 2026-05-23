<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Réinitialisation de mot de passe</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #1a1a1a; margin-top: 0;">Code de réinitialisation</h2>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
            Vous avez demandé la réinitialisation de votre mot de passe pour <strong>Système d'Archivage PV</strong>. 
            Veuillez utiliser le code à 6 chiffres ci-dessous pour continuer.
        </p>
        
        <div style="margin: 30px 0; text-align: center;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; background-color: #eef2ff; padding: 15px 30px; border-radius: 6px;">
                {{ $code }}
            </span>
        </div>

        <p style="color: #4a4a4a; font-size: 14px; line-height: 1.5;">
            Ce code est valide pendant 15 minutes. Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet email.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-bottom: 0;">
            &copy; {{ date('Y') }} Archive Team. Tous droits réservés.
        </p>
    </div>
</body>
</html>
