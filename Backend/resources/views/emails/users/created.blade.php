<!DOCTYPE html>
<html>
<head>
    <title>Bienvenue sur Système D'archivage</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Bonjour {{ $user->name }},</h2>
    
    <p>Un compte a été créé pour vous sur le Système D'archivage avec le rôle : <strong>{{ $user->role }}</strong>.</p>
    
    <p>Voici vos informations de connexion :</p>
    <ul>
        <li><strong>Email :</strong> {{ $user->email }}</li>
        <li><strong>Mot de passe temporaire :</strong> {{ $password }}</li>
    </ul>
    
    <p>Vous pouvez vous connecter en utilisant le lien ci-dessous :</p>
    <p><a href="{{ $loginUrl }}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Se connecter</a></p>
    
    <p><em>Il est fortement recommandé de changer votre mot de passe après votre première connexion.</em></p>
    
    <p>Cordialement,<br>L'équipe Système D'archivage</p>
</body>
</html>
