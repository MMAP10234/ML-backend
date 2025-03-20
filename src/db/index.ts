import { PrismaVectorStore } from "@langchain/community/vectorstores/prisma";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { PrismaClient, Prisma, WebsiteEmbeddings, Note } from "@prisma/client";
import { Document } from "@langchain/core/documents";

/**
 * DB Class - Handles all database operations using Prisma.
 * 
 * - **Admin Management**:
 *   - `getAdmin(email)`: Retrieves an admin user by email.
 *   - `generateAdmin(email, name, id)`: Creates a new admin user.
 * 
 * - **Website Management**:
 *   - `getWebsite(url)`: Finds a website entry by its URL.
 *   - `addWebsite(adminId, url, name, notes, domain)`: Creates a new website record linked to an admin, including associated notes.
 * 
 * - **Embeddings & Retrieval**:
 *   - `addWebsiteEmbeddings(webId, docs)`: Adds embeddings for a website by storing document content in the vector store.
 *   - `getRetriever(webId)`: Returns a retriever that fetches relevant website embeddings.
 * 
 * - **Response Management**:
 *   - `saveResponse(query, response, category, sessionId)`: Saves a query-response pair with a category and session ID.
 *   - `getAllResponses(sessionId)`: Retrieves all responses for a given session.
 * 
 * - **Session Management**:
 *   - `createNewSession(webId)`: Creates a new session for a website, including its associated notes.
 *   - `getAllSessions(webId)`: Fetches all sessions related to a specific website, including their notes.
 */

export class DB {
    public db: PrismaClient;
    public vectorStore;

    constructor() {
        this.db = new PrismaClient();
        this.vectorStore = PrismaVectorStore.withModel<WebsiteEmbeddings>(this.db).create(
            new MistralAIEmbeddings(),
            {
                prisma: Prisma,
                tableName: "WebsiteEmbeddings",
                vectorColumnName: "vector",
                columns: {
                    id: PrismaVectorStore.IdColumn,
                    content: PrismaVectorStore.ContentColumn,
                }
            }
        )
    }

    public async getAdmin(email: string) {
        const admin = await this.db.admin.findFirst({
            where: {
                email: email
            }   
        })
        return admin;
    }

    public async generateAdmin(email: string, name: string, id: string) {
        const admin = await this.db.admin.create({
            data: {
                email,
                name,
                id
            }   
        })
        return admin;
    }


    public async getWebsite(url: string) {
        const website = await this.db.website.findFirst({
            where: {
                url: url
            }
        })
        return website
    }

    async addWebsite(adminId: string, url: string, name: string, notes: Array<Note>, domain: string) {
        try {
            const website = await this.db.website.create({
                data: {
                    adminId,
                    url,
                    domain,
                    name,
                    notes: {
                        create: notes,
                      }
                }
            })
            return website;
        }catch(e) {
            console.log(e);
        }
    }

    async addWebsiteEmbeddings(webId: string, docs: Document[]) {
        await this.vectorStore.addModels(
                await this.db.$transaction(
                    docs.map((doc) => this.db.websiteEmbeddings.create({ data: { 
                        content: doc.pageContent,
                        webId: webId
                     } }))
                )
              );
        
    }

    getRetriever(webId: string) {
        return this.vectorStore.asRetriever({
            k: 3,
            filter: {
              webId: {equals: webId}
            },
          });
    }

    async saveResponse(query: string, response: string, category: string, sessionId: string) {
        await this.db.response.create({
            data: {
                query,
                response,
                category,
                sessionId
            }
        })
    }
    async getAllResponses(sessionId: string) {
        const responses = await this.db.response.findMany({
            where: {
                sessionId: sessionId,
            }
        })
        return responses;
    }

    async createNewSession(webId: string) {
        const session = await this.db.session.create({
            data: {
                webId,
            },
            include: {
                website: {
                    select: {
                        notes: true
                    }
                }
            }
        })
        return session;
    }

    async getAllSessions(webId: string) {
        const sessions = await this.db.session.findMany({
            where: {
                webId
            },
            include: {
                website: {
                    select: {
                        notes: true
                    }
                }
            }
        })
        return sessions;
    }

}

