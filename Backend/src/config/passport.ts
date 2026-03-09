import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { dynamoDBService } from '../services/dynamodb.service';
import { TABLES } from './aws';

dotenv.config();

interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified: boolean }>;
  photos?: Array<{ value: string }>;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error(
    'Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile: GoogleProfile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Check if user exists
        const existingUsers = await dynamoDBService.queryByEmail(
          TABLES.USERS,
          email
        );

        let user;
        if (existingUsers.length > 0) {
          user = existingUsers[0];
          
          // Update last login
          await dynamoDBService.updateAttributes(
            TABLES.USERS,
            { id: user.id },
            {
              lastLogin: new Date().toISOString(),
              profilePicture: profile.photos?.[0]?.value || user.profilePicture,
            }
          );
        } else {
          // Create new user
          user = {
            id: profile.id,
            email,
            name: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            role: 'user',
          };

          await dynamoDBService.put(TABLES.USERS, user);
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await dynamoDBService.get(TABLES.USERS, { id });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
