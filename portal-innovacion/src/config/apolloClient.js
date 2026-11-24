import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { SetContextLink } from '@apollo/client/link/context';
import { supabase } from '../services/supabaseClient';

// Error Link - Manejo de errores global
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// HTTP Link - Configuración de la conexión
const httpLink = new HttpLink({
  uri: process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4001/graphql',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth Link - el servicio de reportes exige la sesión del administrador (NB-MAT-P3-07)
const authLink = new SetContextLink(async (prevContext) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return {
    headers: {
      ...prevContext.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Crear el cliente de Apollo
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Configuración de políticas de cache si es necesario
          listarConsultas: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;